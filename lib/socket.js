module.exports.listen = function(app) {
  io = require('socket.io').listen(app);
  io.sockets.on('connection', function (socket) {
    setInterval(function(){
      var forest = Math.floor((Math.random()*100)+10)
      socket.emit('ping', forest);
    }, 500);
  });

  return io;
};
