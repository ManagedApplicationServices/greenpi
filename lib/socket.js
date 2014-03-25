var client = require('redis').createClient();

module.exports.listen = function(app) {

  client.set('tree1', 100);
  client.set('tree2', 100);
  client.set('tree3', 100);
  client.set('tree4', 100);

  io = require('socket.io').listen(app);
  var currentTree = 1;

  io.sockets.on('connection', function (socket) {
    setInterval(function() {
      if(currentTree === 1) {
        client.decr('tree1', function (err, reply) {
          socket.emit('ping', reply);
          console.log('tree1');
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 2) {
        client.decr('tree2', function (err, reply) {
          socket.emit('ping', reply);
          console.log('tree2');
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 3) {
        client.decr('tree3', function (err, reply) {
          socket.emit('ping', reply);
          console.log('tree3');
          if(reply === 0) currentTree += 1;
        });
      } else if(currentTree === 4) {
        client.decr('tree4', function (err, reply) {
          socket.emit('ping', reply);
          console.log('tree4');
          if(reply === 0) currentTree += 1;
        });
      } else {
        client.decr('tree5', function (err, reply) {
          socket.emit('ping', reply);
          console.log('tree5');
          if(reply === 0) currentTree += 1;
        });
      }
    }, 500);

  });

  return io;
};
