'use strict';

require('dotenv').load();
var isOnline = require('is-online');
var client = require('redis').createClient();
var dbNum = 0;
var logger = require('./log');
var jsdom = require('jsdom');
var timestamp = require('./timestamp');
var fs = require('fs');
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');
var async = require('async');
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
  forest.offset = 0;
  return forest;
}

function initForest(forest, isReset, config) {
  forest.completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
  forest.maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
  forest.interval = parseInt(config.interval, 10);
  forest.printerIP = config.printerIP;
  forest.printerInfoUrl = 'http://' + config.printerIP + config.machineDetailPath;

  if (isReset) {
    forest.remainingPaper = forest.maxPaperToPrint;
  }

  return forest;
}

// all get functions
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

function getAllData(model, callback) {
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

function getArrayData(model, callback) {
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

exports.getPrinterCap = getPrinterCap;
exports.getSimulationStatus = getSimulationStatus;
exports.getPrinterInfo = getPrinterInfo;
exports.getIPAddress = getIPAddress;
exports.getLivePrinterCount = getLivePrinterCount;
exports.getEachCount = getEachCount;
exports.getAllData = getAllData;
exports.getArrayData = getArrayData;

exports.setDemoMode = setDemoMode;

exports.parseIntData = parseIntData;
