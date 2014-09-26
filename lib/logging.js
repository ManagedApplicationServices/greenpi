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

exports.printSuddenShutdown = function printSuddenShutdown(logger) {
  logger.info('Resumed logging after sudden shutdown!');
  logger.info('---------------------------------');
  return;
};

exports.printAfterResume = function printAfterResume(logger) {
  logger.info(timestamp.get() + 'Started logging after resuming!');
  logger.info('---------------------------------');
  return;
};

exports.printAfterEachCount = function printAfterEachCount(logger, forest) {
  logger.info(timestamp.get() + 'COUNT: ' + forest.count);
  logger.info(timestamp.get() + 'Printer ID: ' + forest.printerID);
  logger.info(timestamp.get() + 'Printer Model: ' + forest.printerModel);
  logger.info(timestamp.get() + 'Printer IP Address: ' + forest.printerIP);
  logger.info(timestamp.get() + 'LIVE printer count: ' + forest.livePrinterCount);
  logger.info(timestamp.get() + 'OFFSET count: ' + forest.offset);
  logger.info(timestamp.get() + 'Yearly CAP: ' + forest.maxPaperToPrint);
  logger.info(timestamp.get() + 'Monthly CAP: ' + parseInt(forest.maxPaperToPrint) / 12);
  logger.info(timestamp.get() + 'Remaining yearly CAP: ' + forest.remainingPaper);
  logger.info(timestamp.get() + 'Leaf difference count: ' + forest.leafDifference);
  logger.info(timestamp.get() + 'Demo mode: ' + forest.demo);
  logger.info(timestamp.get() + 'Connection to printer: ' + forest.isInternetAvailable);
  logger.info('---------------------------------');
  return;
};
