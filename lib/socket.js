var client = require('redis').createClient();

module.exports.listen = function(app) {

  client.set('leavesTotal', 1000);
  io = require('socket.io').listen(app);

  io.sockets.on('connection', function (socket) {
    setInterval(function() {
      client.decr('leavesTotal', function (err, reply) {
        if(reply < 1) {
          console.log('all forest is gone :(');
        } else {
          socket.emit('ping', reply);
        }
      });
    }, 50);

  });

  return io;
};
