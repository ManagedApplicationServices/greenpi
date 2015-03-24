'use strict';

var isOnline = require('is-online');
var client = require('redis').createClient();
var dbNum = 0;
var logger = require('./log');
var jsdom = require('jsdom');
var timestamp = require('./timestamp');
var fs = require('fs');
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var async = require('async');

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

function getPrinterCap(model, callback) {
  client.select(dbNum, function() {
    client.get('singlePrinterCap', function(error, reply) {
      if (error) {
        logger.error(error);
        return;
      }

      model.singlePrinterCap = reply;
      callback(null, model);
    });
  })
}

function getSimulationStatus(model, callback) {
  client.select(dbNum, function() {
    client.get('simulation', function(error, reply) {
      if (error) {
        logger.error(error);
        return;
      }

      model.simulation = reply;
      callback(null, model);
    });
  })
}

function initForest(forest, config) {
  forest.completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
  forest.maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
  forest.interval = parseInt(config.interval, 10);
  forest.remainingPaper = config.paperUsageCap;
  forest.printerIP = config.printerIP;
  forest.printerInfoUrl = 'http://' + config.printerIP + config.machineDetailPath;

  return forest;
}

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

function reset(forest) {
  forest.livePrinterCount = 0;
  forest.count = 0;
  forest.last = 0;
  forest.remainingPaper = 0;
  forest.simulationStartDatetime = new Date();
  forest.offset = 0;
  return forest;
}

function getLivePrinterCount(forest, callback) {
  var jsdom = require('jsdom');
  var fs = require('fs');
  var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');

  jsdom.env({
    url: forest.completePrinterURL,
    src: [ jquery ],
    done: function(errors, window) {
      forest.livePrinterCount = parseInt(window.$('.staticProp')
        .find('td:contains("Total")')
        .first()
        .next()
        .next()
        .text());
      callback(forest);
    }
  });
}

function getEachCount(forest) {
  forest.leafDifference = forest.remainingPaper - (parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset));
  forest.remainingPaper = parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset);
  return forest;
}

function readAllData(model, callback) {
  var data = [
    'paperCapPerPrinterPerYear',
    'currentTreeNum',
    'paperRemaining',
    'demo',
    'simulation',
    'simulationStartAt',
    'simulationCurrentTime',
    'printerID',
    'printerModel',
    'livePrinterCount',
    'count'
  ];
  var count = 0;

  client.select(dbNum, function(error) {
    if (error) {
      return callback(error, model);
    }

    async.every(data, function(eachData, cb) {
      client.get(eachData, function(err, reply) {
        if (!err) {
          model[eachData] = reply;
        } else {
          console.log(err);
        }
        cb(!err);
      })
    }, function(result) {
      if (result) {
        callback(null, model)
      } else {
        callback(new Error('Error in reading data'), model);
      }
    });
  });
}

function parseIntData(model, callback) {
  model.paperCapPerPrinterPerYear = parseInt(model.paperCapPerPrinterPerYear);
  model.currentTreeNum = parseInt(model.currentTreeNum);
  model.paperRemaining = parseInt(model.paperRemaining);
  model.livePrinterCount = parseInt(model.livePrinterCount);
  model.count = parseInt(model.count);

  return callback(null, model);
}

function readArrayData(model, callback) {
  client.select(dbNum, function() {
    client.lrange('dataset', 0, -1, function(error, array) {
      if (error) {
        console.log(error)
      } else {
        model.dataset = array.map(function(num) {
          return parseInt(num);
        });
      }
      client.lrange('monthset', 0, -1, function(error, array) {
        if (error) {
          console.log(error)
        } else {
          model.monthset = array.map(function(num) {
            return parseInt(num);
          });
        }
        return callback(error, model);
      })
    })
  })
}

exports.setDemoMode = setDemoMode;
exports.getPrinterCap = getPrinterCap;
exports.getSimulationStatus = getSimulationStatus;
exports.initForest = initForest;
exports.getPrinterInfo = getPrinterInfo;
exports.reset = reset;
exports.getLivePrinterCount = getLivePrinterCount;
exports.getEachCount = getEachCount;
exports.readAllData = readAllData;
exports.parseIntData = parseIntData;
exports.readArrayData = readArrayData;
