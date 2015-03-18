'use strict';

var client = require('redis').createClient();
var month = require('./month');
var timestamp = require('./timestamp');

exports.reset = function reset(resetParam, callback) {
  if (resetParam === 'reset') {
    client.select(0, function() {
      client.flushdb();
      callback(null);
    });
  } else {
    callback(null);
  }
};

exports.init = function init(forest, callback) {
  client.select(0, function(err) {
    client.flushdb();
    client.set('simulation', 'running');
    client.set('simulationStartAt', forest.simulationStartDatetime);
    client.set('paperRemaining', forest.maxPaperToPrint);
    callback(err);
  });
};

exports.start = function start(forest, callback) {
  client.select(0, function() {

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
};

exports.setPrinterInfo = function setPrinterInfo(reply, callback) {
  client.select(0, function(err) {
    client.set('printerModel', reply.printerModel);
    client.set('printerID', reply.printerID);
    callback(err);
  });
};

exports.setEachCountBefore = function setEachCountBefore(logger, forest, callback) {
  client.select(0, function(err) {

    if (err) {
      logger.error(timestamp.get() + 'Set in DB error: ' + err);
    }

    client.set('livePrinterCount', forest.livePrinterCount);
    client.set('count', forest.count);
    client.set('simulationCurrentTime', new Date());
    callback(null);
  });
};

exports.setEachCountAfter = function setEachCountAfter(forest, leafMonthTotal, callback) {
  client.select(0, function() {
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
};

exports.setNewMonth = function(callback) {
  client.select(0, function() {
    if (month.isNew(new Date())) {
      client.rpush('monthset', month.getCurrentMonthIndex());
      callback(null);
    } else {
      callback(null);
    }
  });
};

exports.setPause = function setPause(callback) {
  client.select(0, function(err) {
    client.set('simulation', 'paused');
    callback(err);
  });
};

exports.getleafMonthTotal = function getleafMonthTotal(forest, callback) {
  client.select(0, function() {
    client.rpop('dataset', function(err, reply) {
      var answer = parseInt(reply) + forest.leafDifference;
      callback(answer);
    });
  });
};
