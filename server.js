'use strict';

var app = require('./index');
var http = require('http');
var server;
var logger = {};
var winston = require ('winston');
var transports = [];
var path = require ('path');

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

server = http.createServer(app);
server.listen(process.env.PORT || 8000);
server.on('listening', function() {
  console.log('Server listening on http://localhost:%d', this.address().port);
  require('./lib/socket').listen(server, logger);
});
