'use strict';

var kraken = require('kraken-js'),
  app = {},
  winston = require ('winston'),
  path = require ('path'),
  transports = [],
  logger = {},
  CronJob = require('cron').CronJob,
  fs = require('fs'),
  logging = require('./lib/logging'),
  timestamp = require('./lib/timestamp');

// cron job for logging
new CronJob('1 0 * * * *', function() {
  logging.setupLogging(function() {
    logger.info(timestamp.get() + 'Started logging in new hour!');
  });
}, null, true, 'Asia/Singapore');

// logging
transports.push(new winston.transports.DailyRotateFile({
  name: 'log',
  datePattern: '.HH',
  filename: path.join(__dirname, 'logs', 'log.backup'),
  level: 'error',
  json: false,
  timestamp: false,
  colorize: false
}));

logger = new winston.Logger({
  transports: transports
});

logger.setLevels(winston.config.syslog.levels);

app.configure = function configure(nconf, next) {
  // Async method run on startup.
  next(null);
};

app.requestStart = function requestStart(server) {
  // Run before most express middleware has been registered.
};

app.requestBeforeRoute = function requestBeforeRoute(server) {
  require('dustjs-linkedin').optimizers.format = function(ctx, node) {
    return node;
  };
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
