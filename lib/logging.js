'use strict';

var fs = require('fs');
var path = require('path');
var timestamp = require('./timestamp');

exports.setupLogging = function setupLogging(callback) {

  var now = new Date();
  var nowHour = ('0' + now.getHours()).slice(-2);
  var currentLogFilename = '';

  currentLogFilename = path.resolve(__dirname, '..', 'logs/log.backup.'.concat(nowHour));

  // clear current log file contents
  fs.writeFile(currentLogFilename, '', function(err) {
    var t = timestamp.get();

    if (err) {
      console.error(t + 'Cannot read current log file' + err);
    } else {
      console.info(t + 'Clear log file ' + currentLogFilename);
    }
    callback(err);
  });
};

exports.printStart = function printStart(logger) {
  logger.info(timestamp.get() + 'Started logging!');
  return;
};

exports.printStartSimulation = function printStartSimulation(logger) {
  logger.info(timestamp.get() + 'Started Simulation');
  logger.info('---------------------------------');
  return;
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

exports.printPause = function printPause(logger) {
  logger.info(timestamp.get() + 'Simulation paused by user');
  logger.info('---------------------------------');
  return;
};

exports.printAfterEachCount = function printAfterEachCount(logger, forest) {
  var t = timestamp.get();

  logger.info(t + 'COUNT: ' + forest.count);
  logger.info(t + 'Printer ID: ' + forest.printerID);
  logger.info(t + 'Printer Model: ' + forest.printerModel);
  logger.info(t + 'Printer IP Address: ' + forest.printerIP);
  logger.info(t + 'LIVE printer count: ' + forest.livePrinterCount);
  logger.info(t + 'OFFSET count: ' + forest.offset);
  logger.info(t + 'Yearly CAP: ' + forest.maxPaperToPrint);
  logger.info(t + 'Monthly CAP: ' + parseInt(forest.maxPaperToPrint) / 12);
  logger.info(t + 'Remaining yearly CAP: ' + forest.remainingPaper);
  logger.info(t + 'Leaf difference count: ' + forest.leafDifference);
  logger.info(t + 'Demo mode: ' + forest.demo);
  logger.info(t + 'Connection to printer: ' + forest.isInternetAvailable);
  logger.info('---------------------------------');

  return;
};

exports.printReset = function printReset(logger) {
  logger.info(timestamp.get() + 'Simulation RESET by Admin');
  logger.info('---------------------------------');
  return;
};
