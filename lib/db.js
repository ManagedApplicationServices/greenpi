'use strict';

var month = require('./month');
var dbNum = 0;
var config = require('../config');

function reset(client, resetParam, callback) {
  if (resetParam === 'reset') {
    var paperNum = parseInt(config.paperUsageCap / config.totalPrinters);

    client.flushdb();

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

    callback(null);
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

function getMonthAndData(client, resetParam) {
  if (resetParam === 'reset') {
    client.rpush('monthset', month.getCurrentMonthIndex()); // array of month index
    client.rpush('dataset', 0); // array of paper usage monthly
  }
  return;
}

function start(client, forest, callback) {
  client.set('paperCapPerPrinterPerYear', forest.maxPaperToPrint);
  client.set('paperRemaining', forest.maxPaperToPrint);
  client.rpush('monthset', month.getCurrentMonthIndex()); // array of month index
  client.rpush('dataset', 0); // array of paper usage monthly
  client.set('simulationCurrentTime', new Date());
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

function setPaperRemaining(client, forest, callback) {
  client.set('paperRemaining', forest.remainingPaper, function() {
    callback(null);
  });
}

function setCurrentMonthLeafCount(client, forest, callback) {
  client.incrby(month.getCurrentMonthYear(), forest.leafDifference, function(error, reply) {
    callback(error, reply);
  });
}

function setEachCountBefore(client, forest, callback) {
  client.set('livePrinterCount', forest.livePrinterCount);
  client.set('count', forest.count);
  client.set('simulationCurrentTime', new Date());
  callback(null);
}

function setNewMonth(client, callback) {
  if (month.isNew(new Date())) {
    client.rpush('monthset', month.getCurrentMonthIndex());
    callback(true);
  } else {
    callback(false);
  }
}

function setPause(client, callback) {
  client.set('simulation', 'paused');
  callback(null);
}

function setEnded(client, callback) {
  client.select(dbNum, function() {
    client.set('simulation', 'ended');
    callback(null);
  })
}

exports.reset = reset;
exports.init = init;
exports.start = start;
exports.setPrinterInfo = setPrinterInfo;
exports.setEachCountBefore = setEachCountBefore;
exports.setNewMonth = setNewMonth;
exports.setPause = setPause;
exports.setEnded = setEnded;
exports.getMonthAndData = getMonthAndData;
exports.setPaperRemaining = setPaperRemaining;
exports.setCurrentMonthLeafCount = setCurrentMonthLeafCount;
