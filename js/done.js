;(function() {
  var socket = io.connect('/');
  socket.emit('setting');
})();
