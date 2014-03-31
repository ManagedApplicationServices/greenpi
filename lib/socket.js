var client = require('redis').createClient();

module.exports.listen = function(app) {

  client.set('leavesTotal', 1000);
  io = require('socket.io').listen(app);
  var random1to20 = 0;
  var current = 1000;
  var next = 0;

  io.sockets.on('connection', function (socket) {
    socket.on('simulation', function (data) {
      if(data === 'start') startSimulation(socket);
      client.set('leavesTotal', 1000);
      io = require('socket.io').listen(app);
      random1to20 = 0;
      current = 1000;
      next = 0;
    });
  });

  function startSimulation(socket) {
    setInterval(function() {

      random1to20 = Math.floor(Math.random() * 20) + 1;
      console.log(random1to20);
      next = current - random1to20;
      client.set('leavesTotal', next);
      current = next;

      if(next < 1) {
        console.log('all forest is gone :(');
        socket.emit('ping', -1);
      } else {
        socket.emit('ping', next);
      }

    }, 500);
  }

  return io;
};
