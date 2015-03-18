'use strict';

var async = require('async');
var client = require('redis').createClient();
var connection = require('../lib/connection');
var db = require('../lib/db');
var logging = require('../lib/logging');
var timestamp = require('../lib/timestamp');
var random = require('../lib/random');
var simulation = require('../lib/simulation');
var resetParam = process.argv[2];

module.exports.listen = function(app, logger) {
  var io = require('socket.io').listen(app, { log: false });
  var forestInterval = null;
  var config = {};
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
    demo: 0,
    printerIP: '',
    interval: 0,
    printerID: '',
    printerModel: '',
    printerInfoUrl: '',
    internetAvailable: false,
    isInitialized: false
  };

  function initSocket(callback) {
    io.sockets.on('connection', function(socket) {
      forest.socket = socket;
      callback(null, forest);
    });
  }

  function resetDB(callback) {
    db.reset(resetParam, function() {
      callback(null);
    });
  }

  function readConfigFile(callback) {
    forest = simulation.initForest(forest, require('../config'));
    callback(null, forest);
  }

  function initSimulation(callback) {

    if (resetParam === 'reset') {
      forest = simulation.reset(forest);
      callback(null);
    } else {
      client.select(0, function() {
        async.series([
          function(callback) {
            client.get('demo', function(err, reply) {
              forest.demo = reply;
              forest.socket.emit('resume');
              logging.printSuddenShutdown(logger);
              callback(null);
            });
          },
          function(callback) {
            client.get('paperRemaining', function(err, reply) {
              forest.remainingPaper = parseInt(reply, 10);
              callback(null);
            });
          },
          function(callback) {
            client.get('count', function(err, reply) {
              forest.count = parseInt(reply, 10);
              callback(null);
            });
          },
          function(callback) {
            client.get('livePrinterCount', function(err, reply) {
              forest.livePrinterCount = parseInt(reply, 10);
              callback(null);
            });
          }
        ]);
        callback(null);
      });
    }
  }

  async.series(
    [
      initSocket,
      resetDB,
      readConfigFile,
      initSimulation
    ],
    function() {

      var socket = forest.socket;

      function startSimulation() {
        var leafMonthTotal = 0;

        forest.count++;

        function setEndSimulation() {
          io.sockets.emit('ping', -1);
          forest.last = true;
          clearInterval(forest.scrappingInterval);
          client.select(0, function() {
            client.set('simulation', 'ended');
          });
        }

        function isInternetAvailable(callback) {
          connection.isAvailable(forest, logger, function(isConnected) {
            forest.isInternetAvailable = isConnected;
            callback(null);
          });
        }

        function getLivePrinterCount(callback) {
          var old;

          if (!forest.demo) { // Not in demo mode

            if (forest.isInternetAvailable) { // Internet available
              simulation.getLivePrinterCount(forest, function(reply) {
                forest.livePrinterCount = reply.livePrinterCount;
                io.sockets.emit('internetAvailable', forest.isInternetAvailable);
                callback(null);
              });
            } else { // Internet not available
              logger.error(timestamp.get() + 'Internet connection is not available.');
              io.sockets.emit('internetNotAvailable', forest.isInternetAvailable);
              callback(null);
            }

          } else { // In demo mode
            old = forest.livePrinterCount;
            forest.livePrinterCount = old + random.num1to5();
            callback(null);
          }
        }

        function setInDBBefore(callback) {
          db.setEachCountBefore(logger, forest, function() {
            callback(null);
          });
        }

        function setNewMonth(callback) {
          db.setNewMonth(function() {
            io.sockets.emit('newMonthStarted', true);
            callback(null);
          });
        }

        function processCount(callback) {
          if (!forest.isInitialized)  {
            db.start(forest, function(reply) {
              forest = reply;
              io.sockets.emit('newMonthStarted', true);
              io.sockets.emit('ping', forest.maxPaperToPrint);
              forest.isInitialized = true;
              callback(null);
            });
          } else {
            forest = simulation.getEachCount(forest);
            leafMonthTotal = 0;
            io.sockets.emit('ping', forest.remainingPaper);

            if (forest.leafDifference > 0) {
              db.getleafMonthTotal(forest, function(reply) {
                leafMonthTotal = reply;
                callback(null);
              });
            } else {
              callback(null);
            }
          }
        }

        function setInDBAfter(callback) {
          db.setEachCountAfter(forest, leafMonthTotal, function(reply) {
            io.sockets.emit('currentMonthTotal', reply);
            callback(null);
          });
        }

        function printLog(callback) {
          logging.printAfterEachCount(logger, forest);
          callback(null);
        }

        if (forest.remainingPaper < 0) {
          setEndSimulation();
        } else {
          async.series([
            isInternetAvailable,
            getLivePrinterCount,
            setInDBBefore,
            setNewMonth,
            processCount,
            setInDBAfter,
            printLog
          ]);
        }
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

      // for resuming simulation after sudden shutdown
      client.get('simulation', function(err, reply) {
        if (reply === 'running') {
          setIntervalForForest(startSimulation, forest.interval);
        }
      });

      socket.on('start', function() {
        socket.broadcast.emit('started');

        function initLogging(callback) {
          logging.setupLogging(function(error) {
            logging.printStart(logger);
            callback(error);
          });
        }

        function initStart(callback) {
          logging.printStartSimulation(logger);
          simulation.reset(forest);
          callback(null);
        }

        function initDB(callback) {
          db.init(forest, function(error) {
            callback(error);
          });
        }

        function emitEvents(callback) {
          io.sockets.emit('paperRemaining', forest.maxPaperToPrint);
          io.sockets.emit('singlePrinterCap', forest.maxPaperToPrint);
          callback(null);
        }

        function setSimulationMode(callback) {
          connection.isAvailable(forest.printerIP, logger, function(isConnected) {
            forest.demo = !isConnected;
            io.sockets.emit('demo', forest.demo);

            client.select(0, function(err) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(err);
            });
          });
        }

        function getPrinterInfo(callback) {
          simulation.getPrinterInfo(forest, function(reply) {
            io.sockets.emit('printerModel', reply.printerModel);
            io.sockets.emit('printerID', reply.printerID);
            db.setPrinterInfo(reply, function(err) {
              callback(err);
            });
          });
        }

        async.series([
          initLogging,
          initStart,
          initDB,
          emitEvents,
          setSimulationMode,
          getPrinterInfo
        ]);
      });

      socket.on('reset', function() {
        socket.broadcast.emit('resetted');

        async.series([
          function(callback) {
            db.init(forest, function(err) {
              callback(err);
            });
          },

          function(callback) {
            clearIntervalForForest();
            logging.printReset(logger);
            forest.remainingPaper = config.paperUsageCap;
            simulation.reset(forest);
            callback(null);
          },

          function(callback) {
            connection.isAvailable(forest, logger, function(isConnected) {
              forest.demo = !isConnected;
              io.sockets.emit('demo', forest.demo);
              callback(null);
            });
          },

          function(callback) {
            client.select(0, function(err) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(err);
            });
          }

        ]);
      });

      socket.on('resume', function() {
        socket.broadcast.emit('resumed');

        client.select(0, function() {
          client.set('simulation', 'running');
        });

        function initLogging(callback) {
          logging.setupLogging(function(err) {
            logging.printAfterResume(logger);
            callback(err);
          });
        }

        function setSimulationMode(callback) {
          connection.isAvailable(forest.printerIP, logger, function(isConnected) {
            forest.demo = !isConnected;
            io.sockets.emit('demo', forest.demo);

            client.select(0, function(err) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(err);
            });
          });
        }

        function getPrinterInfo(callback) {
          simulation.getPrinterInfo(forest, function(reply) {
            io.sockets.emit('printerModel', reply.printerModel);
            io.sockets.emit('printerID', reply.printerID);

            db.setPrinterInfo(forest, function(err) {
              callback(err);
            });
          });
        }

        async.series([
          initLogging,
          setSimulationMode,
          getPrinterInfo
        ]);
      });

      socket.on('pause', function() {
        clearIntervalForForest();
        socket.broadcast.emit('paused');
        logging.printPause(logger);
        db.setPause(function() {
          return;
        });
      });

      socket.on('setting', function() {
        socket.broadcast.emit('setting');
        return;
      });

      socket.on('currentTreeNum', function(currentTreeNum) {
        client.set('currentTreeNum', currentTreeNum);
        return;
      });

      socket.on('disconnect', function() {
        clearIntervalForForest();
        return;
      });
    }
  );

  return io;
};
