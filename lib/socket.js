var client = require('redis').createClient();
var jsdom = require('jsdom');
var fs = require('fs');
var config = require('./config').data;
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var dateFormat = require('dateformat');
var now = new Date();

module.exports.listen = function(app) {

  var maxPaperToPrint = config.paperUsageCap / config.totalPrinters;

  client.set('paperRemaining', maxPaperToPrint);
  io = require('socket.io').listen(app);

  var livePrinterCount = 0;
  var current = maxPaperToPrint;
  var count = 0;
  var remainingPaper = maxPaperToPrint;
  var last = 0;
  var simulationStartDatetime;
  var offset = 0;

  io.sockets.on('connection', function (socket) {
    socket.on('simulation', function (data) {
      if(data === 'start') startSimulation(socket);
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

  function startSimulation(socket) {
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
          url: config.baseUrl + config.paperUsagePath,
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
