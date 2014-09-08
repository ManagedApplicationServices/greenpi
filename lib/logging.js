'use strict';

var dateFormat = require('dateformat'),
  fs = require('fs'),
  async = require('async');

exports.setupLogging = function setupLogging(callback) {

  var now = new Date(),
    nowHour = now.getHours(),
    nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ',
    srcLog = __dirname + '/logs/log.backup.' + nowHour,
    destLog =  __dirname + '/logs/log',
    oldestLog = __dirname + '/logs/log.backup.' + (nowHour + 1);

  function removeLogFile(callback) {          // destLog
    fs.exists(destLog, function(exists) {
      if (exists) {
        fs.unlink(destLog, function(err) {
          if (err) {
            console.log(nowFormatted + err);
            callback(null);
          } else {
            callback(null);
          }
        });
      }
    });
  }

  function createCurrentLog(callback) {         // srcLog
    fs.exists(srcLog, function(exists) {
      if (exists) {
        fs.unlink(srcLog, function(err) {
          if (err) {
            console.log(nowFormatted + err);
            fs.openSync(srcLog, 'w');
            callback(null);
          } else {
            callback(null);
          }
        });
      } else {
        fs.openSync(srcLog, 'w');
        callback(null);
      }
    });
  }

  function removeOldestLog(callback) {         // oldestLog
    fs.exists(oldestLog, function(exists) {
      if (exists) {
        fs.unlink(oldestLog, function(err) {
          if (err) {
            console.log(nowFormatted + err);
            callback(null);
          } else {
            callback(null);
          }
        });
      }
    });
  }

  function createLogFile(callback) {            // destLog
    fs.openSync(destLog, 'w');
    callback(null);
  }

  async.series([
    removeLogFile,
    createCurrentLog,
    removeOldestLog,
    createLogFile
    ], function(err) {
      if (err) {
        console.log(nowFormatted + err);
        return;
      } else {
        fs.symlink(srcLog, destLog, 'file', function(err) {
          if (err) {
            console.log(nowFormatted + err);
          } else {
            return;
          }
        });
      }
  });

};
