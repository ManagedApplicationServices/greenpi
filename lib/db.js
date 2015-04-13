'use strict';

var month = require('./month');
var dbNum = 0;
var config = require('../config');
var async = require('async');

function reset(client) {
  var totalPrinterNum = config.greenpiIP.length;
  var paperNum = parseInt(config.paperUsageCap / totalPrinterNum);

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

  client.del('dataset');
  client.del('monthset');
  return;
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

  client.del('dataset');
  client.del('monthset');
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

function getDemo(client, forest, callback) {
  client.get('demo', function(err, reply) {
    if (err) {
      return callback(err, null)
    }

    forest.demo = (reply === 'true')
    callback(null, forest);
  });
}

function getPrinterCap(client, model, callback) {
  client.get('singlePrinterCap', function(error, reply) {
    if (error) {
      return callback(error, null);
    }

    model.singlePrinterCap = reply;
    callback(null, model);
  });
}

function getSimulationStatus(model, callback) {
  var client = require('./socket').client;
  client.get('simulation', function(error, reply) {
    if (error) {
      return callback(error, null);
    }

    model.simulation = reply;
    callback(null, model);
  });
}

function getPaperRemaining(client, forest, callback) {
  client.get('paperRemaining', function(err, reply) {
    if (err) {
      return callback(err, null)
    }
    forest.remainingPaper = parseInt(reply, 10);
    callback(null, forest);
  });
}

function getCount(client, forest, callback) {
  client.get('count', function(err, reply) {
    if (err) {
      return callback(err, null)
    }
    forest.count = parseInt(reply, 10);
    callback(null, forest);
  });
}

function getLivePrinterCount(client, forest, callback) {
  client.get('livePrinterCount', function(err, reply) {
    if (err) {
      return callback(err, null)
    }
    forest.livePrinterCount = parseInt(reply, 10);
    callback(null, forest);
  });
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
  var client = require('./socket').client;

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
}

function getArrayData(model, callback) {
  var client = require('./socket').client;
  client.lrange('dataset', 0, -1, function(error, array) {
    if (error) {
      return callback(error, null);
    }

    model.dataset = array.map(function(num) {
      return parseInt(num);
    });

    client.lrange('monthset', 0, -1, function(error, array) {
      if (error) {
        return callback(error, null);
      }
      model.monthset = array.map(function(num) {
        return parseInt(num);
      });

      return callback(null, model);
    })
  })
}

function setMonthsetAndDataset(client) {
  client.rpush('monthset', month.getCurrentMonthIndex()); // array of month index
  client.rpush('dataset', 0); // array of paper usage monthly
}

function getSimulation(client, forest, callback) {
  client.get('simulation', function(err, reply) {
    if (err) {
      return callback(err, forest);
    }
    if (reply === 'running') {
      forest.isInitialized = true;
    }
    callback(null, forest);
  });
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

function setPause(client) {
  client.set('simulation', 'paused');
  return;
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

exports.setMonthsetAndDataset = setMonthsetAndDataset;
exports.getSimulation = getSimulation;
exports.getDemo = getDemo;
exports.getPrinterCap = getPrinterCap;
exports.getSimulationStatus = getSimulationStatus;
exports.getPaperRemaining = getPaperRemaining;
exports.getCount = getCount;
exports.getLivePrinterCount = getLivePrinterCount;
exports.getAllData = getAllData;
exports.getArrayData = getArrayData;

exports.setPrinterInfo = setPrinterInfo;
exports.setEachCountBefore = setEachCountBefore;
exports.setNewMonth = setNewMonth;
exports.setPause = setPause;
exports.setEnded = setEnded;
exports.setPaperRemaining = setPaperRemaining;
exports.setCurrentMonthLeafCount = setCurrentMonthLeafCount;
