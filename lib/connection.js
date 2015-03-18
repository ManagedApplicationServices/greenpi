'use strict';

exports.isAvailable = function isAvailable(forest, logger, callback) {
  var timestamp = require('./timestamp')
  var net = require('net');
  var tcpSocket = new net.Socket();
  var timeout = 1000;

  tcpSocket.setTimeout(timeout);

  tcpSocket.on('error', function() {
    if (logger) {
      if (forest.demo) {
        logger.info(timestamp.get(), 'Demo - connection to printer error: ', forest.printerIP);
      } else {
        logger.info(timestamp.get(), 'Connection to printer error : ', forest.printerIP);
      }
    }
    tcpSocket.destroy();
    callback(false);
  });

  tcpSocket.on('timeout', function() {
    if (logger) {
      if (forest.demo){
        logger.info(timestamp.get(), 'Demo - connection to printer timeout: ', forest.printerIP);
      } else {
        logger.info(timestamp.get(), 'Connection to printer timeout : ', forest.printerIP);
      }
    }
    tcpSocket.destroy();
    callback(false);
  });

  tcpSocket.connect(80, forest.printerIP, function() {
    logger.error(timestamp.get(), 'Successfully connected to the printer: ', forest.printerIP);
    tcpSocket.end();
    callback(true);
  });
};
