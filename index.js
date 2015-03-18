'use strict';

var express = require('express');
var kraken = require('kraken-js');
var bodyParser = require('body-parser');

var options = {
  onconfig: function(config, next) {
    next(null, config);
  }
};
var app = module.exports = express();

app.use(kraken(options));
app.use(bodyParser.json());

app.on('start', function() {
  console.log('Application ready to serve requests.');
  console.log('Environment: %s', app.kraken.get('env:env'));
});
