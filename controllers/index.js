'use strict';

var redis = require('redis');
var client = redis.createClient();
var fs = require('fs');
var jsdom = require('jsdom');
var async = require('async');

var configFile = './config.json';
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');

var IndexModel = require('../models/index');

module.exports = function (app) {

  var model = {
    printerModel: '',
    printerID: '',
    singlePrinterCap: 0,
    simulation: ''
  };

  var config = {};

  function readConfigFile(callback) {
    fs.readFile(configFile, 'utf8', function (err, data) {
      config = JSON.parse(data);
      callback(null, model);
    });
  }

  function getPrinterInfo(callback) {
    var completePrinterInfoURL = 'http://' + config.printerIP + config.machineDetailPath;

    jsdom.env({
      url: completePrinterInfoURL,
      src: [jquery],
      done: function (errors, window) {

        model.printerModel = window.$('.staticProp')
          .find("td:contains('Model Name')")
          .first()
          .next()
          .next()
          .text();

        model.printerID = window.$('.staticProp')
          .find("td:contains('Machine ID')")
          .first()
          .next()
          .next()
          .text();

        callback(null, model);
        }
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
    [readConfigFile, getPrinterInfo, getPrinterCap, getSimulationStatus],
    function () {
      app.get('/', function (req, res) {
        res.render('index', model);
      });
    }
  );

};
