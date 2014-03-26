var client = require('redis').createClient();

module.exports.listen = function(app) {

  var leavesPerTree = 100;
  client.set('tree1', leavesPerTree);
  client.set('tree2', leavesPerTree);
  client.set('tree3', leavesPerTree);
  client.set('tree4', leavesPerTree);
  client.set('tree5', leavesPerTree);

  io = require('socket.io').listen(app);

  var currentTree = 1;

  io.sockets.on('connection', function (socket) {
    setInterval(function() {
      if(currentTree === 1) {
        client.decr('tree1', function (err, reply) {
          socket.emit('ping', reply);
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 2) {
        client.decr('tree2', function (err, reply) {
          socket.emit('ping', reply);
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 3) {
        client.decr('tree3', function (err, reply) {
          socket.emit('ping', reply);
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 4) {
        client.decr('tree4', function (err, reply) {
          socket.emit('ping', reply);
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 5){
        client.decr('tree5', function (err, reply) {
          if(reply < 1) {
            console.log('all forest is gone :(');
          } else {
            socket.emit('ping', reply);
          }
        });
      }
    }, 10000);

  });

  return io;
};
