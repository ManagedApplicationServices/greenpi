;(function() {
  'use strict';
  var socket = io.connect('/');
  socket.emit('start');
})();
