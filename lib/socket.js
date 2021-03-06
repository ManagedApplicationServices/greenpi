'use strict';

var async = require('async');
var client = require('redis').createClient();
var connection = require('../lib/connection');
var db = require('../lib/db');
var logging = require('../lib/logging');
var timestamp = require('../lib/timestamp');
var random = require('../lib/random');
var forestLib = require('../lib/forest');
var resetParam = process.argv[2];
var month = require('../lib/month');
var config = require('../config');

var forestInterval = null;
var forest = {
  maxPaperToPrint: 0,
  livePrinterCount: 0,
  count: 0,
  remainingPaper: 0,
  last: 0,
  simulationStartDatetime: 0,
  completePrinterURL: '',
  offset: 0,
  leafDifference: 0,
  socket: {},
  demo: false,
  printerIP: '',
  interval: 0,
  printerID: '',
  printerModel: '',
  printerInfoUrl: '',
  internetAvailable: false,
  isInitialized: false
};
var leafMonthTotal = {};

var arrayResetFunc = [];
var arrayNotResetFunc = [];

exports.client = client;

module.exports.listen = function(app, logger) {
  var io = require('socket.io').listen(app, { log: false });

  // for resuming simulation after sudden shutdown
  function checkResume(next) {
    db.getSimulation(client, forest, function(error, reply) {
      if (error) {
        logger.error(timestamp.get() + error);
        return next(null);
      }
      forest = reply;
      next(null);
    })
  }

  function initSocket(next) {
    io.sockets.on('connection', function(socket) {
      forest.socket = socket;
      next(null);
    });
  }

  function resetDB(next) { // for reset
    db.reset(client);
    next(null);
  }

  function readConfigFile(next) {
    if (resetParam === 'reset') {
      forest = forestLib.initForest(forest, true, config);
    } else {
      forest = forestLib.initForest(forest, false, config);
    }
    next(null);
  }

  function resetSimulation(next) { // for reset
    forest = forestLib.reset(forest);
    next(null);
  }

  function getDemo(next) { // for not reset
    db.getDemo(client, forest, function(error, reply) {
      if (error) {
        logger.error(timestamp.get() + error);
        return next(null);
      }
      forest = reply;
      forest.socket.emit('restart');
      logging.printSuddenShutdown(logger);
      next(null);
    })
  }

  function getPaperRemaining(next) { // for not reset
    db.getPaperRemaining(client, forest, function(error, reply) {
      if (error) {
        logger.error(timestamp.get() + error);
        return next(null);
      }
      forest = reply;
      next(null);
    })
  }

  function getCount(next) { // for not reset
    db.getCount(client, forest, function(error, reply) {
      if (error) {
        logger.error(timestamp.get() + error);
        return next(null);
      }
      forest = reply;
      next(null);
    })
  }

  function getLivePrinterCount(next) { // for not reset
    db.getLivePrinterCount(client, forest, function(error, reply) {
      if (error) {
        logger.error(timestamp.get() + error);
        return next(null);
      }
      forest = reply;
      next(null);
    })
  }

  function setMonthsetAndDataset(next) { // for reset
    db.setMonthsetAndDataset(client);
    next(null);
  }

  // called as: setIntervalForForest(startSimulation, forest.interval);
  function setIntervalForForest(method, interval) {
    if (forestInterval === null) {
      forestInterval = setInterval(method, interval);
      method();
    }
  }

  function clearIntervalForForest() {
    clearInterval(forestInterval);
    forestInterval = null;
  }

  function setEndSimulation(forest) {
    io.sockets.emit('ping', -1);
    forest.last = true;
    clearInterval(forest.scrappingInterval);
    db.setEnded(client, function() {
      return;
    })
  }

  function getLivePrinterCountAfterStart(callback) {
    var old;

    if (!forest.demo) { // Not in demo mode
      forestLib.getLivePrinterCount(forest, function(errors, reply) {
        if (errors) {
          logger.error(timestamp.get() + 'Internet connection is not available.');
          forest.isInternetAvailable = false;
          io.sockets.emit('internetNotAvailable', forest.isInternetAvailable);
          callback(null);
        } else {
          forest.livePrinterCount = reply.livePrinterCount;
          forest.isInternetAvailable = true;
          io.sockets.emit('internetAvailable', forest.isInternetAvailable);
          callback(null);
        }
      });
    } else { // In demo mode
      old = forest.livePrinterCount;
      forest.isInternetAvailable = true;
      forest.livePrinterCount = old + random.num1to5();
      callback(null);
    }
  }

  function setInDBBefore(callback) {
    db.setEachCountBefore(client, forest, function() {
      callback(null);
    });
  }

  function setNewMonth(callback) {
    db.setNewMonth(client, function(isNewMonth) {
      if (isNewMonth) {
        io.sockets.emit('newMonthStarted', true);
      }
      callback(null);
    });
  }

  function setPaperRemaining(callback) {
    db.setPaperRemaining(client, forest, function(error) {
      if (error) {
        logger.error(timestamp.get() + 'setPaperRemaining: ' + error);
        return callback(null);
      }
      callback(null);
    })
  }

  function setCurrentMonthLeafCount(callback) {
    db.setCurrentMonthLeafCount(client, forest, function(error) {
      if (error) {
        logger.error(timestamp.get() + 'setCurrentMonthLeafCount: ' + error);
        return callback(null);
      }
      callback(null);
    })
  }

  function printLog(callback) {
    logging.printAfterEachCount(logger, forest);
    callback(null);
  }

  function initLogging(callback) {
    logging.setupLogging(function(error) {
      logging.printStart(logger);
      callback(error);
    });
  }

  function initLoggingAfterResume(next) {
    logging.setupLogging(function(err) {
      logging.printAfterResume(logger);
      next(err);
    });
  }

  function initStart(callback) {
    logging.printStartSimulation(logger);
    forestLib.initForest(forest, true, config);
    forestLib.reset(forest);
    callback(null);
  }

  function initDB(callback) {
    db.init(client, forest, function() {
      callback(null);
    });
  }

  function emitEvents(callback) {
    io.sockets.emit('paperRemaining', forest.maxPaperToPrint);
    io.sockets.emit('singlePrinterCap', forest.maxPaperToPrint);
    callback(null);
  }

  function getPrinterInfo(callback) {
    forestLib.getPrinterInfo(forest, function(reply) {
      io.sockets.emit('printerModel', reply.printerModel);
      io.sockets.emit('printerID', reply.printerID);
      db.setPrinterInfo(client, reply, function(err) {
        callback(err);
      });
    });
  }

  function getIPAddress(callback) {
    forestLib.getIPAddress(function(error, ip) {
      io.sockets.emit('ipAddress', ip);
      callback(error);
    })
  }

  function processCount(callback) {
    var countStr = forest.count.toString();

    if (!forest.isInitialized)  {
      db.start(client, forest, function(reply) {
        forest = reply;
        io.sockets.emit('newMonthStarted', true);
        io.sockets.emit('ping', forest.maxPaperToPrint);
        forest.isInitialized = true;
        callback(null);
      });
    } else {
      forest = forestLib.getEachCount(forest); // remove NaN forest.leafDifference
      leafMonthTotal[countStr] = 0;
      io.sockets.emit('ping', forest.remainingPaper);

      if (forest.leafDifference > 0) {
        client.rpop('dataset', function(err, reply) {
          if (err) {
            logger.error(timestamp.get() + 'Cannot read: ' + err);
          } else {
            leafMonthTotal[countStr] = parseInt(reply) + forest.leafDifference;
          }
          client.rpush('dataset', parseInt(reply)); // add a callback
          callback(null);
        });
      } else {
        callback(null);
      }
    }
  }

  function setInDBAfter(callback) {
    var countStr = forest.count.toString();
    if (forest.leafDifference > 0) {
      client.rpop('dataset', function(error) {
        if (error) {
          logger.error(timestamp.get() + 'RPOP: ' + error);
          return callback(null);
        }

        client.rpush('dataset', parseInt(leafMonthTotal[countStr]));
        delete leafMonthTotal[countStr];
        client.get(month.getCurrentMonthYear(), function(err, reply) {
          if (err) {
            logger.error(timestamp.get() + 'GET: ' + err);
            return callback(null);
          }

          io.sockets.emit('currentMonthTotal', reply);
          callback(null);
        });
      });
    } else {
      io.sockets.emit('currentMonthTotal', leafMonthTotal[countStr]);
      delete leafMonthTotal[countStr];
      callback(null);
    }
  }

  function setSimulationMode(callback) {
    connection.isAvailable(forest, logger, function(isConnected) {
      forest.demo = !isConnected;
      io.sockets.emit('demo', forest.demo);

      client.set('demo', forest.demo);
      setIntervalForForest(startSimulation, forest.interval);
      callback(null);
    });
  }

  function resetSimulationAfterAdminReset(next) {
    clearIntervalForForest();
    logging.printReset(logger);
    forestLib.reset(forest);
    forestLib.initForest(forest, true, config);
    forest.leafDifference = 0;
    leafMonthTotal = {};
    next(null);
  }

  function resetDBAfterAdminReset(next) {
    db.reset(client);
    db.init(client, forest, function(err) {
      if (err) {
        logger.error(timestamp.get() + err);
        return next(err);
      }
      next(null);
    });
  }

  function setMonthsetAndDatasetAfterAdminReset(next) {
    db.setMonthsetAndDataset(client, 'reset');
    next(null);
  }

  function setDemoAfterAdminReset(next) {
    connection.isAvailable(forest, logger, function(isConnected) {
      forest.demo = !isConnected;
      io.sockets.emit('demo', forest.demo);
      client.set('demo', forest.demo);
      next(null);
    });
  }

  function startSimulationAfterAdminReset(next) {
    setIntervalForForest(startSimulation, forest.interval);
    next(null);
  }

  function pauseSimulation() {
    clearIntervalForForest();
    forest.socket.broadcast.emit('paused');
    logging.printPause(logger);
    db.setPause(client);
    return;
  }

  function setSimulationModeAfterResume(next) {
    client.set('simulation', 'running');
    connection.isAvailable(forest, logger, function(isConnected) {
      forest.demo = !isConnected;
      io.sockets.emit('demo', forest.demo);
      client.set('demo', forest.demo);
      setIntervalForForest(startSimulation, forest.interval);
      next(null);
    });
  }

  function setSimulationModeAfterRestart(next) {
    connection.isAvailable(forest, logger, function(isConnected) {
      forest.demo = !isConnected;
      io.sockets.emit('demo', forest.demo);
      client.set('demo', forest.demo);
      setIntervalForForest(startSimulation, forest.interval);
      next(null);
    });
  }

  function startSimulation() {
    forest.count++;
    leafMonthTotal[forest.count.toString()] = 0;

    if (forest.remainingPaper < 0) {
      setEndSimulation(forest);
    } else {
      async.series([
        getLivePrinterCountAfterStart,
        setInDBBefore,
        setNewMonth,
        processCount,
        setPaperRemaining,
        setCurrentMonthLeafCount,
        setInDBAfter,
        printLog
      ]);
    }
  }

  function runSimulation() {
    var socket = forest.socket;

    // a user clicks start button to start simulation
    socket.on('start', function() {
      socket.broadcast.emit('started');

      async.series([
        initLogging,
        initStart,
        resetDB,
        initDB,
        emitEvents,
        setSimulationMode,
        getPrinterInfo,
        getIPAddress
      ]);
    });

    // an admin clicks reset button to reset and start simulation
    socket.on('reset', function() {
      socket.broadcast.emit('resetted');

      async.series([
        resetSimulationAfterAdminReset,
        resetDBAfterAdminReset,
        setMonthsetAndDatasetAfterAdminReset,
        setDemoAfterAdminReset,
        getPrinterInfo,
        startSimulationAfterAdminReset
      ]);
    });

    // a user clicks pause to pause simulation
    socket.on('pause', function() {
      pauseSimulation();
    });

    // a user clicks resume to resume simulation
    socket.on('resume', function() {
      socket.broadcast.emit('resumed');

      async.series([
        initLoggingAfterResume,
        setSimulationModeAfterResume,
        getPrinterInfo,
        getIPAddress
      ]);
    });

    // automatically restart after sudden shutdown
    socket.on('restarted', function() {
      socket.broadcast.emit('resumed');
      client.set('simulation', 'running');

      async.series([
        initLoggingAfterResume,
        setSimulationModeAfterRestart,
        getPrinterInfo,
        getIPAddress
      ]);
    });

    socket.on('setting', function() {
      socket.broadcast.emit('setting');
      return;
    });

    socket.on('currentTreeNum', function(currentTreeNum) {
      client.set('currentTreeNum', currentTreeNum);
      return;
    });
  }

  arrayResetFunc = [
    checkResume,
    initSocket,
    resetDB,
    readConfigFile,
    resetSimulation,
    setMonthsetAndDataset
  ];
  arrayNotResetFunc = [
    checkResume,
    initSocket,
    readConfigFile,
    getDemo,
    getPaperRemaining,
    getCount,
    getLivePrinterCount
  ];

  var arrayFunc = resetParam === 'reset' ? arrayResetFunc : arrayNotResetFunc;
  async.series(arrayFunc, runSimulation);

  return io;
};
