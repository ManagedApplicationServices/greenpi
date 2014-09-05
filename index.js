'use strict';

var kraken = require('kraken-js'),
  app = {},
  dateFormat = require('dateformat'),
  winston = require ('winston'),
  path = require ('path'),
  transports = [],
  logger = {},
  CronJob = require('cron').CronJob,
  fs = require('fs');

// cron job for logging - symlink and delete oldest file every 30th sec
new CronJob('* 2 * * * *', function(){
  var now = new Date(),
    nowHour = now.getHours(),
    nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ',
    srcLog = __dirname + '/logs/log.backup.' + nowHour,
    destLog =  __dirname + '/logs/log',
    oldestLog = __dirname + '/logs/log.backup.' + (nowHour + 1);

  // delete log file
  fs.unlink(destLog, function(err) {
    if (err) logger.error(nowFormatted + err);
    logger.info(nowFormatted + ' Deleted ' + srcLog);

    // symlink to log file
    fs.symlink(srcLog, destLog, 'file', function(err) {
      if (err) logger.error(nowFormatted + err);

      // delete oldest log file
      fs.unlink(oldestLog, function(err) {
        if (err) logger.error(nowFormatted + err);
        logger.info(nowFormatted + ' Deleted ' + oldestLog);
      });

    });

  });
}, null, true, 'Asia/Singapore');

// logging
transports.push(new winston.transports.DailyRotateFile({
  name: 'log',
  datePattern: '.HH',
  filename: path.join(__dirname, "logs", "log.backup"),
  level: 'error',
  json: false,
  timestamp: false,
  colorize: false
}));

logger = new winston.Logger({transports: transports});
logger.setLevels(winston.config.syslog.levels);

app.configure = function configure(nconf, next) {
  // Async method run on startup.
  next(null);
};

app.requestStart = function requestStart(server) {
  // Run before most express middleware has been registered.
};

app.requestBeforeRoute = function requestBeforeRoute(server) {
  require('dustjs-linkedin').optimizers.format = function(ctx, node) { return node };
};

app.requestAfterRoute = function requestAfterRoute(server) {
  // Run after all routes have been added.
};

if (require.main === module) {
  kraken.create(app).listen(function(err, server) {
    if (err) {
      console.error(err.stack);
    }
    var io = require('./lib/socket').listen(server, logger);
  });
}

module.exports = app;
