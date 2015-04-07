'use strict';

require('dotenv').load();
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
var config = require('../config');

module.exports.listen = function(app, logger) {
  var io = require('socket.io').listen(app, { log: false });
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

  function resetDB(next) {
    if (resetParam === 'reset') {
      db.reset(client);
    }
    next(null);
  }

  function readConfigFile(next) {
    if (resetParam === 'reset') {
      forest = simulationLib.initForest(forest, true, config);
    } else {
      forest = simulationLib.initForest(forest, false, config);
    }
    next(null);
  }

  function resetSimulation(callback) {
    if (resetParam === 'reset') {
      forest = simulationLib.reset(forest);
    }
    callback(null);
  }

  function getDemo(callback) {
    if (resetParam !== 'reset') {
      db.getDemo(client, forest, function(error, reply) {
        if (error) {
          logger.error(timestamp.get() + error);
          return callback(null);
        }
        forest = reply;
        forest.socket.emit('restart');
        logging.printSuddenShutdown(logger);
      })
    }
    callback(null);
  }

  function getPaperRemaining(callback) {
    if (resetParam !== 'reset') {
      db.getPaperRemaining(client, forest, function(error, reply) {
        if (error) {
          logger.error(timestamp.get() + error);
          return callback(null);
        }
        forest = reply;
      })
    }
    callback(null);
  }

  function getCount(callback) {
    if (resetParam !== 'reset') {
      db.getCount(client, forest, function(error, reply) {
        if (error) {
          logger.error(timestamp.get() + error);
          return callback(null);
        }
        forest = reply;
      })
    }
    callback(null);
  }

  function getLivePrinterCount(callback) {
    if (resetParam !== 'reset') {
      db.getLivePrinterCount(client, forest, function(error, reply) {
        if (error) {
          logger.error(timestamp.get() + error);
          return callback(null);
        }
        forest = reply;
      })
    }
    callback(null);
  }

  function setMonthAndData(callback) {
    if (resetParam === 'reset') {
      db.setMonthAndData(client);
    }
    callback(null);
  }

  function runSimulation() {

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
          forest = simulationLib.getEachCount(forest); // remove NaN forest.leafDifference
          leafMonthTotal = 0;
          io.sockets.emit('ping', forest.remainingPaper);

          if (forest.leafDifference > 0) {
            client.rpop('dataset', function(err, reply) {
              if (err) {
                logger.error(timestamp.get() + 'Cannot read: ' + err);
              } else {
                leafMonthTotal = parseInt(reply) + forest.leafDifference;
              }
              client.rpush('dataset', parseInt(reply)); // add a callback
              callback(null);
            });
          } else {
            callback(null);
          }
        }
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

      function setInDBAfter(callback) {
        if (forest.leafDifference > 0) {
          client.rpop('dataset', function(error) {
            if (error) {
              logger.error(timestamp.get() + 'RPOP: ' + error);
              return callback(null);
            }

            client.rpush('dataset', parseInt(leafMonthTotal));
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
          setPaperRemaining,
          setCurrentMonthLeafCount,
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

      function getIPAddress(callback) {
        simulationLib.getIPAddress(function(error, ip) {
          io.sockets.emit('ipAddress', ip);
          callback(error);
        })
      }

      async.series([
        initLogging,
        initStart,
        initDB,
        emitEvents,
        setSimulationMode,
        getPrinterInfo,
        getIPAddress
      ]);
    });

    socket.on('reset', function() {
      socket.broadcast.emit('resetted');

      async.series([
        function(next) {
          clearIntervalForForest();
          logging.printReset(logger);
          simulationLib.reset(forest);
          forest.remainingPaper = config.paperUsageCap;
          db.reset(client, 'reset', function(err) {
            if (err) {
              logger.error(timestamp.get() + err);
              return next(err);
            }
            db.init(client, forest, function(err) {
              if (err) {
                logger.error(timestamp.get() + err);
                return next(err);
              }
              next(null);
            });
          });
        },

        function(next) {
          db.setMonthAndData(client, 'reset');
          next(null);
        },

        function(next) {
          connection.isAvailable(forest, logger, function(isConnected) {
            forest.demo = !isConnected;
            io.sockets.emit('demo', forest.demo);
            next(null);
          });
        },

        function(next) {
          simulationLib.getPrinterInfo(forest, function(reply) {
            io.sockets.emit('printerModel', reply.printerModel);
            io.sockets.emit('printerID', reply.printerID);

            db.setPrinterInfo(client, forest, function(err) {
              next(err);
            });
          });
        },

        function(next) {
          client.set('demo', forest.demo);
          setIntervalForForest(startSimulation, forest.interval);
          next(null);
        }

      ]);
    });

    socket.on('resume', function() {
      socket.broadcast.emit('resumed');
      client.set('simulation', 'running');

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

      function getIPAddress(callback) {
        simulationLib.getIPAddress(function(error, ip) {
          io.sockets.emit('ipAddress', ip);
          callback(error);
        })
      }

      async.series([
        initLogging,
        setSimulationMode,
        getPrinterInfo,
        getIPAddress
      ]);
    });

    socket.on('restarted', function() {
      socket.broadcast.emit('resumed');
      client.set('simulation', 'running');

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

      function getIPAddress(callback) {
        simulationLib.getIPAddress(function(error, ip) {
          io.sockets.emit('ipAddress', ip);
          callback(error);
        })
      }

      async.series([
        initLogging,
        setSimulationMode,
        getPrinterInfo,
        getIPAddress
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
  }

  if (resetParam === 'reset') {
    async.series(
      [
        checkResume,
        initSocket,
        resetDB,
        readConfigFile,
        resetSimulation,
        getLivePrinterCount,
        setMonthAndData
      ],
      runSimulation
    );
  } else {
    async.series(
      [
        checkResume,
        initSocket,
        readConfigFile,
        resetSimulation,
        getDemo,
        getPaperRemaining,
        getCount,
        getLivePrinterCount,
        setMonthAndData
      ],
      runSimulation
    );
  }

  return io;
};
