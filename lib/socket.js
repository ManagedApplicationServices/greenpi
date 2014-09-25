'use strict';

var async = require('async'),
  client = require('redis').createClient(),
  dateFormat = require('dateformat'),
  fs = require('fs'),
  http = require('http'),
  jsdom = require('jsdom'),
  isOnline = require('is-online'),
  logging = require('../lib/logging'),
  timestamp = require('../lib/timestamp'),
  random = require('../lib/random'),
  month = require('../lib/month'),
  jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8'),
  configFile = './config.json',
  resetParam = process.argv[2];

module.exports.listen = function(app, logger) {
  var io = require('socket.io').listen(app),
    forestInterval = null,
    forest = {
      maxPaperToPrint: 0,
      livePrinterCount: 0,
      count: 0,
      remainingPaper: 0,
      last: 0,
      simulationStartDatetime: 0,
      completePrinterURL: '',
      offset: 0,
      leafDifference: 0,
      MONTHS: [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec'
      ],
    socket: {},
    demo: 0,
    printerIP: '',
    interval: 0,
    printerID: '',
    printerModel: '',
    printerInfoUrl: '',
    internetAvailable: false
  };

  function initSocket(callback) {
    io.sockets.on('connection', function(socket) {
      forest.socket = socket;
      callback(null, forest);
    });
  }

  function resetDB(callback) {
    if (resetParam === 'reset') {
      client.select(0, function(err, res) {
        client.flushdb();
        callback(null);
      });
    } else {
      callback(null);
    }
  }

  function readConfigFile(callback) {
    fs.readFile(configFile, 'utf8', function(err, data) {
      if (err) {
        logger.error('Cannot read ' + configFile + ': ' + err);
        return;
      }

      var config = JSON.parse(data);

      forest.completePrinterURL = 'http://' + config.printerIP + config.paperUsagePath;
      forest.maxPaperToPrint = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);
      forest.interval = parseInt(config.interval, 10);
      forest.remainingPaper = config.paperUsageCap;
      forest.printerIP = config.printerIP;
      forest.printerInfoUrl = 'http://' + config.printerIP + config.machineDetailPath;

      callback(null, forest);
    });
  }

  function initSimulation(callback) {
    if (resetParam === 'reset') {
      forest.livePrinterCount = 0;
      forest.count = 0;
      forest.last = 0;
      forest.simulationStartDatetime;
      forest.offset = 0;
      callback(null, forest);
    } else {
      client.select(0, function(err, res) {
        async.series(
          [
            function(callback) {
              client.get('demo', function(err, reply) {
                forest.demo = reply;
                forest.socket.emit('resume');
                logger.info('Resumed logging after sudden shutdown!');
                logger.info('---------------------------------');
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
          ],
          function() {
            callback(null, forest);
          }
        );
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
        var currentMonth = new Date().getMonth(),
          currentYear = new Date().getYear(),
          currentMonthYear = forest.MONTHS[new Date().getMonth()] + (new Date().getYear().toString()).slice(-2),
          leafMonthTotal = 0;

        forest.count++;

        function setEndSimulation() {
          io.sockets.emit('ping', -1);
          forest.last = true;
          clearInterval(forest.scrappingInterval);
          client.select(0, function(err, res) {
            client.set('simulation', 'ended');
          });
        }

        function isInternetAvailable(callback) {
          var printerIP = 'http://' + forest.printerIP;

          isOnline([ printerIP ], function(err, online) {
            if (online) {
              forest.isInternetAvailable = true;
              callback(null, forest);
            } else {
              if (forest.demo) {
                logger.info(timestamp.get() + 'Demo - no connection to printer: ' + printerIP);
              } else {
                logger.error(timestamp.get() + 'No connection to the printer: ' + printerIP);
              }
              forest.isInternetAvailable = false;
              callback(null, forest);
            }
          });
        }

        function getLivePrinterCount(callback) {
          var old;

          if (!forest.demo) { // Not in demo mode

            if (forest.isInternetAvailable) { // Internet available

              jsdom.env({
                url: forest.completePrinterURL,
                src: [
                  jquery
                ],
                done: function(errors, window) {
                  var td =
                  forest.livePrinterCount = parseInt(window.$('.staticProp').find('td:contains("Total")').first().next().next().text());
                  io.sockets.emit('internetAvailable', forest.isInternetAvailable);
                  setInDB();
                }
              });
            } else { // Internet not available
              logger.error(timestamp.get() + 'Internet connection is not available.');
              io.sockets.emit('internetNotAvailable', forest.isInternetAvailable);
              setInDB();
            }

          } else {
            old = forest.livePrinterCount;
            forest.livePrinterCount = old + random.num1to5();
            setInDB();
          }

          function setInDB() {
            client.select(0, function(err, res) {

              if (err) {
                logger.error(timestamp.get() + 'Set in DB error: ' + err);
              }

              client.set('livePrinterCount', forest.livePrinterCount);
              client.set('count', forest.count);
              client.set('simulationCurrentTime', new Date());
              callback(null, forest);
            });
          }
        }

        function processCount(callback) {

          if (forest.count === 1)  {
            forest.offset = forest.livePrinterCount;
            client.select(0, function(err, res) {
              client.set('paperCapPerPrinterPerYear', forest.maxPaperToPrint);
              client.set('paperRemaining', forest.maxPaperToPrint);
              client.rpush('monthset', currentMonth);
              client.set('simulationCurrentTime', new Date());
              client.rpush('dataset', 0);
              client.set('count', 1);
              client.set('livePrinterCount', forest.livePrinterCount);
            });

            io.sockets.emit('ping', forest.maxPaperToPrint);
            forest.leafDifference = 0;
            forest.remainingPaper = parseInt(forest.maxPaperToPrint);
            io.sockets.emit('newMonthStarted', true);
          } else {
            forest.leafDifference = forest.remainingPaper - (parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset));
            forest.remainingPaper = parseInt(forest.maxPaperToPrint) - parseInt(forest.livePrinterCount - forest.offset);
            leafMonthTotal = 0;

            io.sockets.emit('ping', forest.remainingPaper);

            client.select(0, function(err, res) {
              client.set('paperRemaining', forest.remainingPaper);
              client.incrby(currentMonthYear, forest.leafDifference);

              if (forest.leafDifference > 0) {
                client.rpop('dataset', function(err, reply) {
                  leafMonthTotal = parseInt(reply) + forest.leafDifference;
                  client.rpush('dataset', leafMonthTotal);
                });

                client.get(currentMonthYear, function(err, reply) {
                  io.sockets.emit('currentMonthTotal', reply);
                });

                if (month.isNew(new Date())) {
                  io.sockets.emit('newMonthStarted', true);
                  client.rpush('monthset', currentMonth);
                }
              }
            });
          }
          callback(null, forest);
        }

        function printLog(callback) {
          logger.info(timestamp.get() + 'COUNT: ' + forest.count);
          logger.info(timestamp.get() + 'Printer ID: ' + forest.printerID);
          logger.info(timestamp.get() + 'Printer Model: ' + forest.printerModel);
          logger.info(timestamp.get() + 'Printer IP Address: ' + forest.printerIP);
          logger.info(timestamp.get() + 'LIVE printer count: ' + forest.livePrinterCount);
          logger.info(timestamp.get() + 'OFFSET count: ' + forest.offset);
          logger.info(timestamp.get() + 'Yearly CAP: ' + forest.maxPaperToPrint);
          logger.info(timestamp.get() + 'Monthly CAP: ' + parseInt(forest.maxPaperToPrint) / 12);
          logger.info(timestamp.get() + 'Remaining yearly CAP: ' + forest.remainingPaper);
          logger.info(timestamp.get() + 'Leaf difference count: ' + forest.leafDifference);
          logger.info(timestamp.get() + 'Demo mode: ' + forest.demo);
          logger.info(timestamp.get() + 'Connection to printer: ' + forest.isInternetAvailable);
          logger.info('---------------------------------');

          callback(null, forest);
        }

        if (forest.remainingPaper < 0) {
          setEndSimulation();
        } else {
          async.series([
            isInternetAvailable,
            getLivePrinterCount,
            processCount,
            printLog
          ]);
        }
      }

      function setIntervalForForest(method, interval) {
        forestInterval = setInterval(method, interval);
      }

      function clearIntervalForForest() {
        clearInterval(forestInterval);
      }

      client.get('simulation', function(err, reply) {
        if (reply === 'running') {
          setIntervalForForest(startSimulation, forest.interval);
        }
      });

      socket.on('start', function() {
        var timeout = 2000,
          req;

        socket.broadcast.emit('started');

        function initLogging(callback) {
          logging.setupLogging(function() {
            logger.info(timestamp.get() + 'Started logging!');
            callback(null);
          });
        }

        function initStart(callback) {
          logger.info(timestamp.get() + 'Started Simulation');
          logger.info('---------------------------------');
          forest.livePrinterCount = 0;
          forest.remainingPaper = 0;
          forest.last = false;
          forest.simulationStartDatetime = new Date();
          forest.count = 0;
          callback(null);
        }

        function initDB(callback) {
          client.select(0, function(err, res) {
            client.flushdb();
            client.set('simulation', 'running');
            client.set('simulationStartAt', forest.simulationStartDatetime);
            client.set('paperRemaining', forest.maxPaperToPrint);
            callback(null);
          });
        }

        function emitEvents(callback) {
          io.sockets.emit('paperRemaining', forest.maxPaperToPrint);
          io.sockets.emit('singlePrinterCap', forest.maxPaperToPrint);
          callback(null);
        }

        function setSimulationMode(callback) {
          var printerIP = 'http://' + forest.printerIP;

          isOnline([ printerIP ], function(err, online) {
            forest.demo = !online;
            io.sockets.emit('demo', forest.demo);

            client.select(0, function(err, res) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(null);
            });
          });
        }

        function getPrinterInfo(callback) {

          if (!forest.demo) {
            jsdom.env({
              url: forest.printerInfoUrl,
              src: [
                jquery
              ],
              done: function(errors, window) {

                if (errors) {
                  logger.error(timestamp.get() + 'jsDom scraping error: ' + errors);
                }

                forest.printerModel = window.$('.staticProp')
                  .find('td:contains("Model Name")')
                  .first()
                  .next()
                  .next()
                  .text();
                io.sockets.emit('printerModel', forest.printerModel);

                forest.printerID = window.$('.staticProp')
                  .find('td:contains("Machine ID")')
                  .first()
                  .next()
                  .next()
                  .text();
                io.sockets.emit('printerID', forest.printerID);

                client.select(0, function(err, res) {
                  client.set('printerModel', forest.printerModel);
                  client.set('printerID', forest.printerID);
                  callback(null);
                });

              }
            });
          } else {
            forest.printerModel = 'printer';
            forest.printerID = 'demo';

            io.sockets.emit('printerModel', forest.printerModel);
            io.sockets.emit('printerID', forest.printerID);

            client.select(0, function(err, res) {
              client.set('printerModel', forest.printerModel);
              client.set('printerID', forest.printerID);
            });
          }
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

      socket.on('resume', function() {
        var timeout = 2000,
          req;

        socket.broadcast.emit('resumed');

        client.select(0, function(err, res) {
          client.set('simulation', 'running');
        });

        function initLogging(callback) {
          logging.setupLogging(function() {
            logger.info(timestamp.get() + 'Started logging after resuming!');
            logger.info('---------------------------------');
            callback(null);
          });
        }

        function setSimulationMode(callback) {
          var printerIP = 'http://' + forest.printerIP;

          isOnline([ printerIP ], function(err, online) {
            forest.demo = !online;
            io.sockets.emit('demo', forest.demo);

            client.select(0, function(err, res) {
              client.set('demo', forest.demo);
              setIntervalForForest(startSimulation, forest.interval);
              callback(null);
            });
          });
        }

        function getPrinterInfo(callback) {

          if (!forest.demo) {
            jsdom.env({
              url: forest.printerInfoUrl,
              src: [
                jquery
              ],
              done: function(errors, window) {

                if (errors) {
                  logger.error(timestamp.get() + 'jsDom scraping error: ' + errors);
                }

                forest.printerModel = window.$('.staticProp')
                  .find('td:contains("Model Name")')
                  .first()
                  .next()
                  .next()
                  .text();
                io.sockets.emit('printerModel', forest.printerModel);

                forest.printerID = window.$('.staticProp')
                  .find('td:contains("Machine ID")')
                  .first()
                  .next()
                  .next()
                  .text();
                io.sockets.emit('printerID', forest.printerID);

                client.select(0, function(err, res) {
                  client.set('printerModel', forest.printerModel);
                  client.set('printerID', forest.printerID);
                  callback(null);
                });

              }
            });
          } else {
            forest.printerModel = 'printer';
            forest.printerID = 'demo';

            io.sockets.emit('printerModel', forest.printerModel);
            io.sockets.emit('printerID', forest.printerID);

            client.select(0, function(err, res) {
              client.set('printerModel', forest.printerModel);
              client.set('printerID', forest.printerID);
            });
          }
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
        logger.info(timestamp.get() + 'Simulation paused by user');
        logger.info('---------------------------------');

        client.select(0, function(err, res) {
          client.set('simulation', 'paused');
        });
      });

      socket.on('setting', function() {
        socket.broadcast.emit('setting');
      });

      socket.on('currentTreeNum', function(currentTreeNum) {
        client.set('currentTreeNum', currentTreeNum);
      });

      socket.on('disconnect', function() {
        clearIntervalForForest();
      });
    }
  );

  return io;
};
