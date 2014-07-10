var http = require('http');

exports.isAvailable = function isAvailable(ipAddress, timeout, callback) {
  var url = 0;
  var options = { hostname: ipAddress };
  var req;

  req = http
    .request(options, function(response) {
      url = true;
      callback(url);
      response.on('data', function () {});
    })
    .on('socket', function (socket) {
      socket.setTimeout(timeout);
      socket.on('timeout', function(event) {
        url = false
        callback(url);
        req.abort();
      });
    })
    .on('error', function(err) {
      return;
    });

  req.end();
};
