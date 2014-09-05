'use strict';

var redis = require('redis'),
  client = redis.createClient(),
  fs = require('fs'),
  jsdom = require('jsdom'),
  async = require('async'),
  url = require('../lib/url'),
  configFile = './config.json',
  jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8'),
  IndexModel = require('../models/index');

module.exports = function(app) {

  var model = {
    singlePrinterCap: 0,
    simulation: '',
    demo: 0,
    timeout: 2000
  },
  config = {};

  function readConfigFile(callback) {
    fs.readFile(configFile, 'utf8', function(err, data) {
      config = JSON.parse(data);
      callback(null, model);
    });
  }

  function setDemoMode(callback) {
    url.isAvailable(config.printerIP, model.timeout, function(isAvailable) {
      model.demo = !isAvailable;

      callback(null, model);
    });
  }

  function getPrinterCap(callback) {
    client.get('singlePrinterCap', function(err, reply) {
      model.singlePrinterCap = reply;
      callback(null, model);
    });
  }

  function getSimulationStatus(callback) {
    client.get('simulation', function(err, reply) {
      model.simulation = reply;
      callback(null, model);
    });
  }

  async.series(
    [
      readConfigFile,
      setDemoMode,
      getPrinterCap,
      getSimulationStatus
    ],
    function() {
      app.get('/', function(req, res) {
        res.render('index', model);
      });
    }
  );

};
