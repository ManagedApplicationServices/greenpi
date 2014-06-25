var client = require('redis').createClient();
var jsdom = require('jsdom');
var fs = require('fs');
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var dateFormat = require('dateformat');
var now = new Date();
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
  io = require('socket.io').listen(app);

  fs.readFile('./config.json', 'utf8', function (err, data) {
    if (err) {
      console.log('Error: ' + err);
      return;
    }

    config = JSON.parse(data);

    maxPaperToPrint = config.paperUsageCap / config.totalPrinters;
    livePrinterCount = 0;
    current = maxPaperToPrint;
    count = 0;
    remainingPaper = maxPaperToPrint;
    last = 0;
    simulationStartDatetime;
    offset = 0;

    client.set('paperRemaining', maxPaperToPrint);

    io.sockets.on('connection', function (socket) {
      socket.on('simulation', function (data) {
        if(data === 'start') startSimulation(socket, config.baseUrl, config.paperUsagePath);
        client.set('paperRemaining', maxPaperToPrint);
        socket.emit('paperRemaining', maxPaperToPrint);
        io = require('socket.io').listen(app);
        livePrinterCount = 0;
        remainingPaper = 0;
        last = false;
        simulationStartDatetime = Date();
        client.set('simulationStartAt', simulationStartDatetime);
      });
    });
  });

  function startSimulation(socket, baseUrl, paperUsagePath) {
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
          url: baseUrl + paperUsagePath,
          src: [jquery],
          done: function (errors, window) {
            livePrinterCount = window.$('.staticProp').find("td:contains('Total')").first().next().next().text();
            livePrinterCount = parseInt(livePrinterCount);
            console.log(count + ':Date: ' + dateFormat(now, 'dddd, mmmm dS, yyyy, h:MM:ss TT'));
            console.log(count + ':Total live printer count: ' + livePrinterCount);

            if(count === 1)  {
              offset = parseInt(livePrinterCount);
              client.set('paperRemaining', maxPaperToPrint);
              socket.emit('ping', maxPaperToPrint);
              console.log(count + ':INITIAL Paper left from CAP: ' + maxPaperToPrint);
            } else {
              remainingPaper = parseInt(maxPaperToPrint) - parseInt(livePrinterCount - offset);
              console.log(count + ':CAP: ' + maxPaperToPrint);
              console.log(count + ':OFFSET: ' + offset);
              client.set('paperRemaining', remainingPaper);
              socket.emit('ping', remainingPaper);
              console.log(count + ':Paper left from CAP: ' + remainingPaper);
            }

          }
        });
      }
    }, 5000);
  }

  return io;
};
