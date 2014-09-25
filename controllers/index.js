'use strict';

var redis = require('redis'),
  client = redis.createClient(),
  fs = require('fs'),
  jsdom = require('jsdom'),
  async = require('async'),
  isOnline = require('is-online'),
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
    var printerIP = 'http://' + config.printerIP;

    isOnline([ printerIP ], function(err, online) {
      model.demo = !online;
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
