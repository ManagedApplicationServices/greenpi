'use strict';

var async = require('async');
var client = require('redis').createClient();
var nconf = require('nconf').argv().env().file({
  file: './config/' + process.env.NODE_ENV + '.json'
});
var dbNum = nconf.get(process.env.NODE_ENV).num;
var connection = require('../lib/connection');
var db = require('../lib/db');
var logging = require('../lib/logging');
var timestamp = require('../lib/timestamp');
var random = require('../lib/random');
var simulationLib = require('../lib/simulation');
var resetParam = process.argv[2];
var month = require('../lib/month');

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
    forest = simulationLib.initForest(forest, require('../config'));
    callback(null, forest);
  }

  function initSimulation(callback) {

    if (resetParam === 'reset') {
      forest = simulationLib.reset(forest);
      callback(null);
    } else {
      client.select(dbNum, function() {
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
          db.setEnded(client, function() {
            return;
          })
        }

        function getLivePrinterCount(callback) {
          var old;

          if (!forest.demo) { // Not in demo mode
            simulationLib.getLivePrinterCount(forest, function(errors, reply) {
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
            db.start(client, forest, function(reply) {
              forest = reply;
              io.sockets.emit('newMonthStarted', true);
              io.sockets.emit('ping', forest.maxPaperToPrint);
              forest.isInitialized = true;
              callback(null);
            });
          } else {
            forest = simulationLib.getEachCount(forest);
            leafMonthTotal = 0;
            io.sockets.emit('ping', forest.remainingPaper);

            if (forest.leafDifference > 0) {
              client.rpop('dataset', function(err, reply) {
                if (err) {
                  logger.error(timestamp.get() + 'Cannot read: ' + err);
                  callback(null);
                } else {
                  leafMonthTotal = parseInt(reply) + forest.leafDifference;
                  callback(null);
                }
              });
            } else {
              callback(null);
            }
          }
        }

        function setInDBAfter(callback) {
          client.set('paperRemaining', forest.remainingPaper);
          client.incrby(month.getCurrentMonthYear(), forest.leafDifference);

          if (forest.leafDifference > 0) {
            client.rpop('dataset', function() {
              client.rpush('dataset', leafMonthTotal);
              client.get(month.getCurrentMonthYear(), function(err, reply) {
                io.sockets.emit('currentMonthTotal', reply);
                callback(null);
              });
            });
          } else {
            io.sockets.emit('currentMonthTotal', leafMonthTotal);
            callback(null);
          }
        }

        function printLog(callback) {
          logging.printAfterEachCount(logger, forest);
          callback(null);
        }

        if (forest.remainingPaper < 0) {
          setEndSimulation();
        } else {
          async.series([
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
          simulationLib.reset(forest);
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

        function setSimulationMode(callback) {
          connection.isAvailable(forest, logger, function(isConnected) {
            forest.demo = !isConnected;
            io.sockets.emit('demo', forest.demo);

            client.select(dbNum, function(err) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(err);
            });
          });
        }

        function getPrinterInfo(callback) {
          simulationLib.getPrinterInfo(forest, function(reply) {
            io.sockets.emit('printerModel', reply.printerModel);
            io.sockets.emit('printerID', reply.printerID);
            db.setPrinterInfo(client, reply, function(err) {
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
            simulationLib.reset(forest);
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
            client.select(dbNum, function(err) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(err);
            });
          }

        ]);
      });

      socket.on('resume', function() {
        socket.broadcast.emit('resumed');

        client.select(dbNum, function() {
          client.set('simulation', 'running');
        });

        function initLogging(callback) {
          logging.setupLogging(function(err) {
            logging.printAfterResume(logger);
            callback(err);
          });
        }

        function setSimulationMode(callback) {
          connection.isAvailable(forest, logger, function(isConnected) {
            forest.demo = !isConnected;
            io.sockets.emit('demo', forest.demo);

            client.select(dbNum, function(err) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(err);
            });
          });
        }

        function getPrinterInfo(callback) {
          simulationLib.getPrinterInfo(forest, function(reply) {
            io.sockets.emit('printerModel', reply.printerModel);
            io.sockets.emit('printerID', reply.printerID);

            db.setPrinterInfo(client, forest, function(err) {
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
        db.setPause(client, function() {
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
