var http = require('http');

exports.isAvailable = function isAvailable(options, myTimeout, callback) {
  var url = 0;
  var req;

  req = http
    .request(options, function(response) {
      url = true;
      callback(url);
      response.on('data', function () {});
    })
    .on('socket', function (socket) {
      socket.setTimeout(myTimeout);
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
