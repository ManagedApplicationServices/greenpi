'use strict';

exports.get = function get() {
  var fs = require('fs'),
    path = require('path'),
    configFile = path.resolve(__dirname, '..', 'config.json');

  return JSON.parse(fs.readFileSync(configFile));
};

exports.initForest = function initForest(forest, config) {
  forest.completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
  forest.maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
  forest.interval = parseInt(config.interval, 10);
  forest.remainingPaper = config.paperUsageCap;
  forest.printerIP = config.printerIP;
  forest.printerInfoUrl = 'http://' + config.printerIP + config.machineDetailPath;

  return forest;
};
