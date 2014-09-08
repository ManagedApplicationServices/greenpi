'use strict';

var dateFormat = require('dateformat'),
  fs = require('fs');

exports.setupLogging = function setupLogging(callback) {

  var now = new Date(),
    nowHour = now.getHours(),
    nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ',
    srcLog = __dirname + '/logs/log.backup.' + nowHour,
    destLog =  __dirname + '/logs/log',
    oldestLog = __dirname + '/logs/log.backup.' + (nowHour + 1);

  // delete log file
  fs.unlink(destLog, function(err) {
    if (err) {
      logger.error(nowFormatted + err);
    }

    logger.info(nowFormatted + ' Deleted ' + srcLog);

    // symlink to log file
    fs.symlink(srcLog, destLog, 'file', function(err) {
      if (err) {
        logger.error(nowFormatted + err);
      }

      // delete oldest log file
      fs.unlink(oldestLog, function(err) {
        if (err) {
          logger.error(nowFormatted + err);
        }

        logger.info(nowFormatted + ' Deleted ' + oldestLog);
        callback(nowFormatted);
      });

    });

  });
};
