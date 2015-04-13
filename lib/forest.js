'use strict';

require('dotenv').load();
var isOnline = require('is-online');
var logger = require('./log');
var jsdom = require('jsdom');
var timestamp = require('./timestamp');
var fs = require('fs');
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var nconf = require('nconf').argv().env().file({
  file: './config/' + process.env.NODE_ENV + '.json'
});
var wifi = nconf.get(process.env.NODE_ENV).wifi;
var localip = require('local-ip');

// all reset / init functions
function reset(forest) {
  forest.livePrinterCount = 0;
  forest.count = 0;
  forest.last = 0;
  forest.simulationStartDatetime = new Date();
  forest.leafDifference = 0;
  forest.offset = 0;
  forest.isInitialized = false;
  return forest;
}

function initForest(forest, isReset, config) {
  var totalPrinterNum = config.greenpiIP.length;

  forest.completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
  forest.maxPaperToPrint = parseInt(config.paperUsageCap, 10) / totalPrinterNum;
  forest.interval = parseInt(config.interval, 10);
  forest.printerIP = config.printerIP;
  forest.printerInfoUrl = 'http://' + config.printerIP + config.machineDetailPath;

  if (isReset) {
    forest.remainingPaper = forest.maxPaperToPrint;
  }

  return forest;
}

// all get functions
function getPrinterInfo(forest, callback) {
  if (!forest.demo) {
    jsdom.env({
      url: forest.printerInfoUrl,
      src: [
        jquery
      ],
      done: function(errors, window) {
        if (errors) {
          return timestamp.get() + 'jsDom scraping error: ' + errors;
        }

        forest.printerModel = window.$('.staticProp')
          .find('td:contains("Model Name")')
          .first()
          .next()
          .next()
          .text();

        forest.printerID = window.$('.staticProp')
          .find('td:contains("Machine ID")')
          .first()
          .next()
          .next()
          .text();

        callback(forest);
      }
    });
  } else {
    forest.printerModel = 'printer';
    forest.printerID = 'demo';
    callback(forest);
  }
}

function getIPAddress(callback) {
  localip(wifi, function(err, res) {
    if (err) {
      logger.error(err);
      return callback(err, null);
    }
    return callback(null, res);
  });
}

function getLivePrinterCount(forest, callback) {
  var jsdom = require('jsdom');
  var fs = require('fs');
  var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.js', 'utf-8');

  jsdom.env({
    url: forest.completePrinterURL,
    src: [ jquery ],
    done: function(errors, window) {
      if (errors) {
        return callback(errors, null);
      } else {
        forest.livePrinterCount = parseInt(window.$('.staticProp')
          .find('td:contains("Total")')
          .first()
          .next()
          .next()
          .text());
        return callback(null, forest);
      }
    }
  });
}

function getEachCount(forest) {
  forest.leafDifference = forest.remainingPaper - (parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset));
  forest.remainingPaper = parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset);
  return forest;
}

// all set functions
function setDemoMode(model, callback) {
  isOnline(function(error, online) {
    if (error) {
      logger.error(error);
      return;
    }

    model.demo = !online;
    callback(null, model);
  });
}

// all other functions
function parseIntData(model, callback) {
  model.paperCapPerPrinterPerYear = parseInt(model.paperCapPerPrinterPerYear);
  model.currentTreeNum = parseInt(model.currentTreeNum);
  model.paperRemaining = parseInt(model.paperRemaining);
  model.livePrinterCount = parseInt(model.livePrinterCount);
  model.count = parseInt(model.count);

  return callback(null, model);
}

exports.reset = reset;
exports.initForest = initForest;

exports.getPrinterInfo = getPrinterInfo;
exports.getIPAddress = getIPAddress;
exports.getLivePrinterCount = getLivePrinterCount;
exports.getEachCount = getEachCount;

exports.setDemoMode = setDemoMode;

exports.parseIntData = parseIntData;
