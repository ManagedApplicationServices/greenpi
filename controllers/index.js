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
    printerModel: '',
    printerID: '',
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
    var options = { hostname: config.printerIP };

    url.isAvailable(options, model.timeout, function(isAvailable) {
      model.demo = !isAvailable;

      callback(null, model);
    });
  }

  function getPrinterInfo(callback) {
    var completePrinterInfoURL = 'http://' + config.printerIP + config.machineDetailPath;

    if(model.demo) {

      model.printerModel = 'printer';
      model.printerID = 'demo';
      callback(null, model);
    } else {
      scrapURL(completePrinterInfoURL, function(reply) {
        model.printerModel = reply.printerModel;
        model.printerID = reply.printerID;
        callback(null, model);
      });
    }

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
    [readConfigFile, setDemoMode, getPrinterInfo, getPrinterCap, getSimulationStatus],
    function () {
      app.get('/', function (req, res) {
        res.render('index', model);
      });
    }
  );

};

function scrapURL(url, callback) {
  var printer = {};

  jsdom.env({
    url: url,
    src: [jquery],
    done: function (errors, window) {

      printer.printerModel = window.$('.staticProp')
        .find("td:contains('Model Name')")
        .first()
        .next()
        .next()
        .text();

      printer.printerID = window.$('.staticProp')
        .find("td:contains('Machine ID')")
        .first()
        .next()
        .next()
        .text();

      callback(null, printer);
      }
    });
}
