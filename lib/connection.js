'use strict';

exports.status = function status(forest, logger, callback) {
  var timestamp = require('./timestamp'),
    exec = require('child_process').exec,
    child,
    execCommand = 'ping -c 1 ' + forest.printerIP;

  child = exec(execCommand, function(error, stdout, stderr) {
   if (error !== null) {
     if (forest.demo) {
       logger.info(timestamp.get() + 'Demo - no connection to printer: ' + '`' + execCommand + '`');
     } else {
       logger.error(timestamp.get() + 'No connection to the printer: ' + '`' + execCommand + '`');
     }
     callback(false);
   } else {
     callback(true);
   }
  });
};

exports.isAvailable = function isAvailable(ipAddress, callback) {
  var url = 0,
    options = { hostname: ipAddress },
    req,
    timeout = 1000,
    http = require('http');

  req = http
    .request(options, function(response) {
      url = true;
      callback(url);
      response.on('data', function() {});
    })
    .on('socket', function(socket) {
      socket.setTimeout(timeout);
      socket.on('timeout', function(event) {
        url = false;
        callback(url);
        req.abort();
      });
    })
    .on('error', function(err) {
      return;
    });

  req.end();
};
