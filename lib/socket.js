var client = require('redis').createClient();
var jsdom = require('jsdom');
var fs = require('fs');
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var dateFormat = require('dateformat');

var configFile = './config.json';
var now;
var config = {};

module.exports.listen = function(app) {

  var maxPaperToPrint = 0;
  var livePrinterCount = 0;
  var count = 0;
  var remainingPaper = 0;
  var last = 0;
  var simulationStartDatetime;
  var offset = 0;
  var leafDifference = 0;
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  io = require('socket.io').listen(app);

  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {console.log('Error: ' + err); return; }

    config = JSON.parse(data);

    maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
    livePrinterCount = 0;
    count = 0;
    remainingPaper = maxPaperToPrint;
    last = 0;
    simulationStartDatetime;
    offset = 0;

    io.sockets.on('connection', function (socket) {
      var completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
      var scrappingInterval;

      client.get('simulation', function(err, reply) {
        if(reply === 'running') {
          scrappingInterval = setInterval(startSimulation, 5000);
        }
      });

      socket.on('start', function (start) {

        if(start) {
          livePrinterCount = 0;
          remainingPaper = 0;
          last = false;
          simulationStartDatetime = new Date();
          count = 0;

          client.select(0, function(err,res){
            client.flushdb();
            client.set('simulation', 'running');
            client.set('simulationStartAt', simulationStartDatetime);
            client.set('paperRemaining', maxPaperToPrint);
          });

          socket.emit('paperRemaining', maxPaperToPrint);
          socket.emit('singlePrinterCap', maxPaperToPrint);

          scrappingInterval = setInterval(startSimulation, 5000);
        }
      });

      function startSimulation() {
        count++;

        if(remainingPaper < 0) {
          if(last) {
            console.log('all forest is gone :(');
          } else {
            socket.emit('ping', -1);
            last = true;
            clearInterval(scrappingInterval);
            client.select(0, function(err,res){
              client.set('simulation', 'ended');
            });
          }
        } else {
          jsdom.env({
            url: completePrinterURL,
            src: [jquery],
            done: function (errors, window) {
              var currentMonth = new Date().getMonth();
              var currentYear = new Date().getYear();
              var currentMonthYear = MONTHS[new Date().getMonth()] + (new Date().getYear().toString()).slice(-2);
              var leafMonthTotal = 0;

              livePrinterCount = window.$('.staticProp').find("td:contains('Total')").first().next().next().text();

              now = new Date();
              console.log(count + ':Date: ' + dateFormat(now, 'dddd, mmmm dS, yyyy, h:MM:ss TT'));
              console.log(count + ':LIVE count: ' + livePrinterCount);

              if(count === 1)  {
                offset = livePrinterCount;

                client.select(0, function(err,res){
                  client.set('paperCapPerPrinterPerYear', maxPaperToPrint)
                  client.set('paperRemaining', maxPaperToPrint);
                  client.rpush('monthset', currentMonth);
                  client.rpush('dataset', 0);
                });

                socket.emit('ping', maxPaperToPrint);
                console.log(count + ':INITIAL Paper left from CAP: ' + maxPaperToPrint);
                leafDifference = 0;
                remainingPaper = parseInt(maxPaperToPrint);
                socket.emit('newMonthStarted', true);

              } else {

                leafDifference = remainingPaper - (parseInt(maxPaperToPrint) - parseInt(livePrinterCount - offset));
                remainingPaper = parseInt(maxPaperToPrint) - parseInt(livePrinterCount - offset);
                leafMonthTotal = 0;

                console.log(count + ':OFFSET count: ' + offset);
                console.log(count + ':Yearly CAP: ' + maxPaperToPrint + ', Monthly CAP: ' + parseInt(maxPaperToPrint)/12);
                console.log(count + ':Remaining yearly CAP: ' + remainingPaper);
                console.log(count + ':Leaf difference count: ' + leafDifference);
                console.log('---------------------------------');

                socket.emit('ping', remainingPaper);

                client.select(0, function(err,res){
                  client.set('paperRemaining', remainingPaper);
                  client.incrby(currentMonthYear, leafDifference);

                  if(leafDifference > 0) {
                    client.rpop('dataset', function(err, reply) {
                      leafMonthTotal = parseInt(reply) + leafDifference;
                      client.rpush('dataset', leafMonthTotal);
                    });

                    client.get(currentMonthYear, function(err, reply) {
                      socket.emit('currentMonthTotal', reply);
                    });

                    if(isNewMonth(now)) {
                      socket.emit('newMonthStarted', true);
                      client.rpush('monthset', currentMonth);
                    }

                  }

                });

              }
            }
          });
        }

        socket.on('stop', function (stop) {
          if(stop) {
            clearInterval(scrappingInterval);

            client.select(0, function(err,res){
              client.set('simulation', 'stopped by user');
            });
          }
        });
      }

      socket.on('disconnect', function() {
        clearInterval(scrappingInterval);
      })

    });
  });



  return io;
};

function isNewMonth(now) {
  var fiveSecondsAgo = new Date(now.getTime() - 5000);

  if(now.getMonth() > fiveSecondsAgo.getMonth()) {
    return false;
  } else {
    return false;
  }
}
