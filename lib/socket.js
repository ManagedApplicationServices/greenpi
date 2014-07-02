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
  var current = 0;
  var count = 0;
  var remainingPaper = 0;
  var last = 0;
  var simulationStartDatetime;
  var offset = 0;
  var leafDifference = 0;

  io = require('socket.io').listen(app);

  fs.readFile(configFile, 'utf8', function (err, data) {
    if (err) {console.log('Error: ' + err); return; }

    config = JSON.parse(data);

    maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
    livePrinterCount = 0;
    current = maxPaperToPrint;
    count = 0;
    remainingPaper = maxPaperToPrint;
    last = 0;
    simulationStartDatetime;
    offset = 0;

    client.set('paperRemaining', maxPaperToPrint);
    client.set('singlePrinterCap', maxPaperToPrint);

    io.sockets.on('connection', function (socket) {
      socket.on('simulation', function (data) {
        var completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;

        if(data === 'start') startSimulation(socket, completePrinterURL);
        client.set('paperRemaining', maxPaperToPrint);
        socket.emit('paperRemaining', maxPaperToPrint);
        socket.emit('singlePrinterCap', maxPaperToPrint);
        io = require('socket.io').listen(app);
        livePrinterCount = 0;
        remainingPaper = 0;
        last = false;
        simulationStartDatetime = Date();
        client.set('simulationStartAt', simulationStartDatetime);
      });
    });
  });

  function startSimulation(socket, completePrinterURL) {
    setInterval(function() {
      count++;

      if(remainingPaper < 0) {
        if(last) {
          console.log('all forest is gone :(');
        } else {
          socket.emit('ping', -1);
          last = true;
        }
      } else {
        jsdom.env({
          url: completePrinterURL,
          src: [jquery],
          done: function (errors, window) {
            var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            var currentMonthYear = MONTHS[new Date().getMonth()] + (new Date().getYear().toString()).slice(-2);

            livePrinterCount = window.$('.staticProp').find("td:contains('Total')").first().next().next().text();
            livePrinterCount = parseInt(livePrinterCount);

            now = new Date();
            console.log(count + ':Date: ' + dateFormat(now, 'dddd, mmmm dS, yyyy, h:MM:ss TT'));
            console.log(count + ':LIVE count: ' + livePrinterCount);

            if(count === 1)  {
              offset = parseInt(livePrinterCount);
              client.set('paperRemaining', maxPaperToPrint);
              socket.emit('ping', maxPaperToPrint);
              console.log(count + ':INITIAL Paper left from CAP: ' + maxPaperToPrint);
              leafDifference = 0;
              remainingPaper = parseInt(maxPaperToPrint);
              socket.emit('newMonthStarted', true);
            } else {
              leafDifference = remainingPaper - (parseInt(maxPaperToPrint) - parseInt(livePrinterCount - offset));
              remainingPaper = parseInt(maxPaperToPrint) - parseInt(livePrinterCount - offset);

              console.log(count + ':OFFSET count: ' + offset);
              console.log(count + ':CAP count: ' + maxPaperToPrint);

              client.set('paperRemaining', remainingPaper);
              socket.emit('ping', remainingPaper);

              console.log(count + ':Remaining CAP count: ' + remainingPaper);
              console.log(count + ':Leaf difference count: ' + leafDifference);

              client.incrby(currentMonthYear, leafDifference);

              if(leafDifference > 0) {

                if(isFiveSecondsAgoAPreviousMonth(now)) {
                  socket.emit('newMonthStarted', true);
                  client.get(currentMonthYear, function(err, reply) {
                    socket.emit('currentMonthTotal', reply);
                  });
                } else {
                  client.get(currentMonthYear, function(err, reply) {
                    socket.emit('currentMonthTotal', reply);
                  })
                }

              }

            }
          }
        });
      }
    }, 5000);
  }

  return io;
};

function isFiveSecondsAgoAPreviousMonth(now) {
  var fiveSecondsAgo = new Date(now.getTime() - 5000);

  if(now.getMonth() > fiveSecondsAgo.getMonth()) {
    return false;
  } else {
    return false;
  }
}
