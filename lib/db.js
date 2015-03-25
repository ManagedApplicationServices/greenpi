'use strict';

var client = require('redis').createClient();
var month = require('./month');
var dbNum = 0;
var config = require('../config');

function reset(resetParam, callback) {
  if (resetParam === 'reset') {
    client.select(dbNum, function() {
      client.flushdb();
      var paperNum = parseInt(config.paperUsageCap / config.totalPrinters);
      client.set('paperCapPerPrinterPerYear', paperNum);
      client.set('paperRemaining', paperNum);
      client.set('simulation', null);
      client.set('simulationStartAt', null);
      client.set('currentTreeNum', 1);
      client.set('demo', null);
      client.set('printerID', null);
      client.set('printerModel', null);
      client.set('simulationCurrentTime', null);
      client.set('count', 0);
      client.set('livePrinterCount', 0);
      client.set(month.getCurrentMonthYear(), 0);

      client.rpush('monthset', 0)
      client.rpush('dataset', 0)
      client.quit();
      callback(null);
    });
  } else {
    callback(null);
  }
}

function init(client, forest, callback) {
  client.set('simulation', 'running');
  client.set('simulationStartAt', forest.simulationStartDatetime);
  client.set('paperRemaining', forest.maxPaperToPrint);
  callback(null);
}

function start(client, forest, callback) {
  client.set('paperCapPerPrinterPerYear', forest.maxPaperToPrint);
  client.set('paperRemaining', forest.maxPaperToPrint);
  client.rpush('monthset', month.getCurrentMonthIndex());
  client.set('simulationCurrentTime', new Date());
  client.rpush('dataset', 0);
  client.set('count', 1);
  client.set('livePrinterCount', forest.livePrinterCount);

  forest.offset = forest.livePrinterCount;
  forest.leafDifference = 0;
  forest.remainingPaper = parseInt(forest.maxPaperToPrint);

  callback(forest);
}

function setPrinterInfo(client, reply, callback) {
  client.set('printerModel', reply.printerModel);
  client.set('printerID', reply.printerID);
  callback(null);
}

function setEachCountBefore(logger, forest, callback) {
  client.set('livePrinterCount', forest.livePrinterCount);
  client.set('count', forest.count);
  client.set('simulationCurrentTime', new Date());
  callback(null);
}

function setNewMonth(callback) {
  if (month.isNew(new Date())) {
    client.rpush('monthset', month.getCurrentMonthIndex());
    callback(null);
  } else {
    callback(null);
  }
}

function setPause(client, callback) {
  client.set('simulation', 'paused');
  callback(null);
}

exports.reset = reset;
exports.init = init;
exports.start = start;
exports.setPrinterInfo = setPrinterInfo;
exports.setEachCountBefore = setEachCountBefore;
exports.setNewMonth = setNewMonth;
exports.setPause = setPause;
