'use strict';

var client = require('redis').createClient();
var month = require('./month');
var timestamp = require('./timestamp');
var dbNum = 0;

function reset(resetParam, callback) {
  if (resetParam === 'reset') {
    client.select(dbNum, function() {
      client.flushdb();
      callback(null);
    });
  } else {
    callback(null);
  }
}

function init(forest, callback) {
  client.select(dbNum, function(err) {
    client.flushdb();
    client.set('simulation', 'running');
    client.set('simulationStartAt', forest.simulationStartDatetime);
    client.set('paperRemaining', forest.maxPaperToPrint);
    callback(err);
  });
}

function start(forest, callback) {
  client.select(dbNum, function() {

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
  });
}

function setPrinterInfo(reply, callback) {
  client.select(dbNum, function(err) {
    client.set('printerModel', reply.printerModel);
    client.set('printerID', reply.printerID);
    callback(err);
  });
}

function setEachCountBefore(logger, forest, callback) {
  client.select(dbNum, function(err) {

    if (err) {
      logger.error(timestamp.get() + 'Set in DB error: ' + err);
    }

    client.set('livePrinterCount', forest.livePrinterCount);
    client.set('count', forest.count);
    client.set('simulationCurrentTime', new Date());
    callback(null);
  });
}

function setEachCountAfter(forest, leafMonthTotal, callback) {
  client.select(dbNum, function() {
    client.set('paperRemaining', forest.remainingPaper);
    client.incrby(month.getCurrentMonthYear(), forest.leafDifference);

    if (forest.leafDifference > 0) {
      client.rpop('dataset', function() {
        client.rpush('dataset', leafMonthTotal);
      });

      client.get(month.getCurrentMonthYear(), function(err, reply) {
        callback(reply);
      });
    } else {
      callback(leafMonthTotal);
    }
  });
}

function setNewMonth(callback) {
  client.select(dbNum, function() {
    if (month.isNew(new Date())) {
      client.rpush('monthset', month.getCurrentMonthIndex());
      callback(null);
    } else {
      callback(null);
    }
  });
}

function setPause(callback) {
  client.select(dbNum, function(err) {
    client.set('simulation', 'paused');
    callback(err);
  });
}

function getleafMonthTotal(forest, callback) {
  client.select(dbNum, function() {
    client.rpop('dataset', function(err, reply) {
      var answer = parseInt(reply) + forest.leafDifference;
      callback(answer);
    });
  });
}

exports.reset = reset;
exports.init = init;
exports.start = start;
exports.setPrinterInfo = setPrinterInfo;
exports.setEachCountBefore = setEachCountBefore;
exports.setEachCountAfter = setEachCountAfter;
exports.setNewMonth = setNewMonth;
exports.setPause = setPause;
exports.getleafMonthTotal = getleafMonthTotal;
