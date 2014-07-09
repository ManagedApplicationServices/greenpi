var client = require('redis').createClient();
var jsdom = require('jsdom');
var fs = require('fs');
var async = require('async');
var dateFormat = require('dateformat');
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var configFile = './config.json';

module.exports.listen = function(app) {

  var config = {};
  var forest = {
    maxPaperToPrint: 0,
    livePrinterCount: 0,
    count: 0,
    remainingPaper: 0,
    last: 0,
    simulationStartDatetime: 0,
    completePrinterURL: '',
    offset: 0,
    leafDifference: 0,
    MONTHS: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    socket: {},
    scrappingInterval: 0
  };

  function readConfigFile(callback) {
    fs.readFile(configFile, 'utf8', function (err, data) {
      if (err) {console.log('Error: ' + err); return; }
      config = JSON.parse(data);
      forest.completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
      callback(null, forest);
    });
  }

  function getmaxPaperToPrintPerYear(callback) {
    forest.maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
    forest.remainingPaper = config.paperUsageCap;
    callback(null, forest);
  }

  function initSimulation(callback) {
    forest.livePrinterCount = 0;
    forest.count = 0;
    forest.last = 0;
    forest.simulationStartDatetime;
    forest.offset = 0;
    callback(null, forest);
  }

  function initSocket(callback) {
    io.sockets.on('connection', function (socket) {
      forest.socket = socket;
      callback(null, forest);
    });
  }

  io = require('socket.io').listen(app);

  async.series(
    [
      readConfigFile,
      getmaxPaperToPrintPerYear,
      initSimulation,
      initSocket
    ],
    function () {

      var socket = forest.socket;

      function startSimulation() {
        forest.count++;

        if(forest.remainingPaper < 0) {
          if(forest.last) {
            console.log('all forest is gone :(');
          } else {
            socket.emit('ping', -1);
            forest.last = true;
            clearInterval(forest.scrappingInterval);
            client.select(0, function(err,res){
              client.set('simulation', 'ended');
            });
          }
        } else {
          jsdom.env({
            url: forest.completePrinterURL,
            src: [jquery],
            done: function (errors, window) {
              var currentMonth = new Date().getMonth();
              var currentYear = new Date().getYear();
              var currentMonthYear = forest.MONTHS[new Date().getMonth()] + (new Date().getYear().toString()).slice(-2);
              var leafMonthTotal = 0;
              var now = new Date();

              forest.livePrinterCount = parseInt(window.$('.staticProp').find("td:contains('Total')").first().next().next().text());

              console.log(forest.count + ':Date: ' + dateFormat(now, 'dddd, mmmm dS, yyyy, h:MM:ss TT'));
              console.log(forest.count + ':LIVE count: ' + forest.livePrinterCount);

              if(forest.count === 1)  {
                forest.offset = forest.livePrinterCount;

                client.select(0, function(err,res){
                  client.set('paperCapPerPrinterPerYear', forest.maxPaperToPrint)
                  client.set('paperRemaining', forest.maxPaperToPrint);
                  client.rpush('monthset', currentMonth);
                  client.rpush('dataset', 0);
                });

                socket.emit('ping', forest.maxPaperToPrint);
                console.log(forest.count + ':INITIAL Paper left from CAP: ' + forest.maxPaperToPrint);
                forest.leafDifference = 0;
                forest.remainingPaper = parseInt(forest.maxPaperToPrint);
                socket.emit('newMonthStarted', true);

              } else {
                forest.leafDifference = forest.remainingPaper - (parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset));
                forest.remainingPaper = parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset);
                leafMonthTotal = 0;

                console.log(forest.count + ':OFFSET count: ' + forest.offset);
                console.log(forest.count + ':Yearly CAP: ' + forest.maxPaperToPrint + ', Monthly CAP: ' + parseInt(forest.maxPaperToPrint)/12);
                console.log(forest.count + ':Remaining yearly CAP: ' + forest.remainingPaper);
                console.log(forest.count + ':Leaf difference count: ' + forest.leafDifference);
                console.log('---------------------------------');

                socket.emit('ping', forest.remainingPaper);

                client.select(0, function(err,res){
                  client.set('paperRemaining', forest.remainingPaper);
                  client.incrby(currentMonthYear, forest.leafDifference);

                  if(forest.leafDifference > 0) {
                    client.rpop('dataset', function(err, reply) {
                      leafMonthTotal = parseInt(reply) + forest.leafDifference;
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
            clearInterval(forest.scrappingInterval);

            client.select(0, function(err,res){
              client.set('simulation', 'stopped by user');
            });
          }
        });
      }

      client.get('simulation', function(err, reply) {
        if(reply === 'running') {
          forest.scrappingInterval = setInterval(startSimulation, 5000);
        }
      });

      socket.on('start', function (start) {
        if(start) {
          forest.livePrinterCount = 0;
          forest.remainingPaper = 0;
          forest.last = false;
          forest.simulationStartDatetime = new Date();
          forest.count = 0;

          client.select(0, function(err,res){
            client.flushdb();
            client.set('simulation', 'running');
            client.set('simulationStartAt', forest.simulationStartDatetime);
            client.set('paperRemaining', forest.maxPaperToPrint);
          });

          socket.emit('paperRemaining', forest.maxPaperToPrint);
          socket.emit('singlePrinterCap', forest.maxPaperToPrint);

          forest.scrappingInterval = setInterval(startSimulation, 5000);
        }
      });

      socket.on('currentTreeNum', function(currentTreeNum) {
        client.set('currentTreeNum', currentTreeNum);
      })

      socket.on('disconnect', function() {
        clearInterval(forest.scrappingInterval);
      })
    }
  );

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
