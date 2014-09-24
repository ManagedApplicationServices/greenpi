'use strict';

var dateFormat = require('dateformat'),
  fs = require('fs'),
  async = require('async'),
  path = require('path'),
  timestamp = require('./timestamp');

exports.setupLogging = function setupLogging(callback) {

  var now = new Date(),
    nowHour = ('0' + now.getHours()).slice(-2),
    currentLogFilename = '';

  currentLogFilename = path.resolve(__dirname, '..', 'logs/log.backup.'.concat(nowHour));

  // clear current log file contents
  fs.writeFile(currentLogFilename, '', function(err) {
    if (err) {
      console.error(timestamp.get() + 'Cannot read current log file' + err);
      callback(null);
    } else {
      console.info(timestamp.get() + 'Clear log file ' + currentLogFilename);
      callback(null);
    }
  });

};
