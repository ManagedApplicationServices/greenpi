'use strict';

var dateFormat = require('dateformat'),
  fs = require('fs'),
  async = require('async'),
  path = require('path');

exports.setupLogging = function setupLogging(callback) {

  var now = new Date(),
    nowHour = ('0' + now.getHours()).slice(-2),
    nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ',
    currentLogFilename = '';

  currentLogFilename = path.resolve(__dirname, '..', 'logs/log.backup.'.concat(nowHour));

  // clear current log file contents
  fs.writeFile(currentLogFilename, '', function(err) {
    if (err) {
      console.error(nowFormatted + 'Cannot read current log file' + err);
      callback(null);
    } else {
      console.info(nowFormatted + 'Clear log file ' + currentLogFilename);
      callback(null);
    }
  });

};
