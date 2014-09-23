'use strict';

var async = require('async'),
  client = require('redis').createClient(),
  dateFormat = require('dateformat'),
  fs = require('fs'),
  http = require('http'),
  jsdom = require('jsdom'),
  url = require('./url'),
  logging = require('../lib/logging'),
  jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8'),
  configFile = './config.json';

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
    interval: 20000,
    printerID: '',
    printerModel: '',
    printerInfoUrl: '',
    internetAvailable: false
  };

  function resetDB(callback) {
    client.select(0, function(err, res) {
      client.flushdb();
      callback(null);
    });
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
      forest.remainingPaper = config.paperUsageCap;
      forest.printerIP = config.printerIP;
      forest.printerInfoUrl = 'http://' + config.printerIP + config.machineDetailPath;

      callback(null, forest);
    });
  }

  function initSimulation(callback) {
    forest.livePrinterCount = 0;
    forest.count = 0;
    forest.last = 0;
    forest.simulationStartDatetime;
    forest.offset = 0;
    callback(null, forest);
  }

  function initSocket(callback) {
    io.sockets.on('connection', function(socket) {
      forest.socket = socket;
      callback(null, forest);
    });
  }

  async.series(
    [
      resetDB,
      readConfigFile,
      initSimulation,
      initSocket
    ],
    function() {

      var socket = forest.socket;

      function startSimulation() {
        var currentMonth = new Date().getMonth(),
          currentYear = new Date().getYear(),
          currentMonthYear = forest.MONTHS[new Date().getMonth()] + (new Date().getYear().toString()).slice(-2),
          leafMonthTotal = 0,
          now = new Date(),
          nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ' ;

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

          var exec = require('child_process').exec, child,
            execCommand = 'ping -c 1 ' + forest.printerIP;

          child = exec(execCommand, function(error, stdout, stderr) {
            if (error !== null) {
              if (forest.demo) {
                logger.info(nowFormatted + 'Demo - no connection to printer: ' + '`' + execCommand + '`');
              } else {
                logger.error(nowFormatted + 'No connection to the printer: ' + '`' + execCommand + '`');
              }
              forest.isInternetAvailable = false;
              callback(null, forest);
            } else {
              forest.isInternetAvailable = true;
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
              logger.error(nowFormatted + 'Internet connection is not available.');
              io.sockets.emit('internetNotAvailable', forest.isInternetAvailable);
              setInDB();
            }

          } else {
            old = forest.livePrinterCount;
            forest.livePrinterCount = old + randNum1to5();
            setInDB();
          }

          function setInDB() {
            client.select(0, function(err, res) {

              if (err) {
                logger.error(nowFormatted + 'Set in DB error: ' + err);
              }

              client.set('livePrinterCount', forest.livePrinterCount);
              client.set('count', forest.count);
              client.set('simulationCurrentTime', now);
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
              client.set('simulationCurrentTime', now);
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

                if (isNewMonth(now)) {
                  io.sockets.emit('newMonthStarted', true);
                  client.rpush('monthset', currentMonth);
                }
              }
            });
          }
          callback(null, forest);
        }

        function printLog(callback) {
          logger.info(nowFormatted + 'COUNT: ' + forest.count);
          logger.info(nowFormatted + 'Printer ID: ' + forest.printerID);
          logger.info(nowFormatted + 'Printer Model: ' + forest.printerModel);
          logger.info(nowFormatted + 'Printer IP Address: ' + forest.printerIP);
          logger.info(nowFormatted + 'LIVE printer count: ' + forest.livePrinterCount);
          logger.info(nowFormatted + 'OFFSET count: ' + forest.offset);
          logger.info(nowFormatted + 'Yearly CAP: ' + forest.maxPaperToPrint);
          logger.info(nowFormatted + 'Monthly CAP: ' + parseInt(forest.maxPaperToPrint) / 12);
          logger.info(nowFormatted + 'Remaining yearly CAP: ' + forest.remainingPaper);
          logger.info(nowFormatted + 'Leaf difference count: ' + forest.leafDifference);
          logger.info(nowFormatted + 'DEMO?: ' + forest.demo);
          logger.info(nowFormatted + 'INTERNET?: ' + forest.isInternetAvailable);
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
          req,
          now = new Date(),
          nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ';

        socket.broadcast.emit('started');

        function initLogging(callback) {
          logging.setupLogging(function() {
            logger.info(nowFormatted + 'Started logging!');
            callback(null);
          });
        }

        function initStart(callback) {
          logger.info(nowFormatted + 'Started Simulation');
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
          url.isAvailable(forest.printerIP, timeout, function(isAvailable) {
            forest.demo = !isAvailable;
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
                  logger.error(nowFormatted + 'jsDom scraping error: ' + errors);
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
          req,
          now = new Date(),
          nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ';

        socket.broadcast.emit('resumed');

        client.select(0, function(err, res) {
          client.set('simulation', 'running');
        });

        function initLogging(callback) {
          logging.setupLogging(function() {
            logger.info(nowFormatted + 'Started logging after resuming!');
            logger.info('---------------------------------');
            callback(null);
          });
        }

        function setSimulationMode(callback) {
          url.isAvailable(forest.printerIP, timeout, function(isAvailable) {
            forest.demo = !isAvailable;
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
                  logger.error(nowFormatted + 'jsDom scraping error: ' + errors);
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
        var now = new Date(),
          nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ';

        clearIntervalForForest();
        socket.broadcast.emit('paused');
        logger.info(nowFormatted + 'Simulation paused by user');
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

function isNewMonth(now) {
  var fiveSecondsAgo = new Date(now.getTime() - 5000);

  if (now.getMonth() > fiveSecondsAgo.getMonth()) {
    return false;
  } else {
    return false;
  }
}

function randNum1to5() {
  var answer = Math.floor(Math.random() * 5) + 1;
  return answer;
}
