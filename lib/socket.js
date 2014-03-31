var client = require('redis').createClient();

module.exports.listen = function(app) {

  client.set('paperRemaining', 1000);
  io = require('socket.io').listen(app);
  var maxPaperToPrint = 1000;
  var random1to20 = 0;
  var current = maxPaperToPrint;
  var next = 0;
  var last = false;
  var simulationStartDatetime;

  io.sockets.on('connection', function (socket) {
    socket.on('simulation', function (data) {
      if(data === 'start') startSimulation(socket);
      client.set('paperRemaining', maxPaperToPrint);
      io = require('socket.io').listen(app);
      random1to20 = 0;
      current = maxPaperToPrint;
      next = 0;
      last = false;
      simulationStartDatetime = Date();
      client.set('simulationStartAt', simulationStartDatetime);
    });
  });

  function startSimulation(socket) {
    setInterval(function() {

      random1to20 = Math.floor(Math.random() * 20) + 1;
      console.log(random1to20);
      next = current - random1to20;
      client.set('paperRemaining', next);
      current = next;

      if(next < 1) {
        if(last) {
          console.log('all forest is gone :(');
        } else {
          socket.emit('ping', -1);
          last = true;
        }
      } else {
        socket.emit('ping', next);
        console.log(next);
      }

    }, 2000);
  }

  return io;
};
