'use strict';

var redis = require('redis');
var client = redis.createClient();
var fs = require('fs');
var jsdom = require('jsdom');
var async = require('async');

var url = require('../lib/url');
var configFile = './config.json';
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');

var IndexModel = require('../models/index');

module.exports = function (app) {

  var model = {
    singlePrinterCap: 0,
    simulation: '',
    demo: 0,
    timeout: 2000
  };

  var config = {};

  function readConfigFile(callback) {
    fs.readFile(configFile, 'utf8', function (err, data) {
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
    [readConfigFile, setDemoMode, getPrinterCap, getSimulationStatus],
    function () {
      app.get('/', function (req, res) {
        res.render('index', model);
      });
    }
  );

};
