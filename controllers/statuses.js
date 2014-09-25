'use strict';

var path = require('path'),
  StatusModel = require('../models/status'),
  redis = require('redis'),
  async = require('async'),
  client = redis.createClient();

module.exports = function(app) {
  var model = {
    paperCapPerPrinterPerYear: 0,
    paperRemaining: 0,
    simulation: '',
    simulationStartAt: '',
    currentTreeNum: 0,
    monthset: [],
    dataset: [],
    demo: 0,
    printerID: '',
    printerModel: '',
    simulationCurrentTime: '',
    count: 0,
    livePrinterCount: 0
  };

  function readAllData(callback) {
    var data = [
      'paperCapPerPrinterPerYear',
      'currentTreeNum',
      'paperRemaining',
      'demo',
      'simulation',
      'simulationStartAt',
      'simulationCurrentTime',
      'printerID',
      'printerModel',
      'livePrinterCount',
      'count'
    ],
    count = 0;

    data.forEach(function(element, index, array) {
      client.select(0, function(error, res) {
        if (error) {
          return error;
        }

        client.get(element, function(err, reply) {
          model[element] = reply;
          count++;
          if (count === data.length) {
            callback(null, model);
          }
        });
      });
    });
  }

  function parseIntData(callback) {
    var data = [
      'paperCapPerPrinterPerYear',
      'currentTreeNum',
      'paperRemaining',
      'livePrinterCount',
      'count'
    ],
    count = 0;

    data.forEach(function(element, index, array) {
      model[element] = parseInt(model[element], 10);
      count++;
      if (count === data.length) {
        callback(null, model);
      }
    });
  }

  function readArrayData(callback) {
    var data = [
      'dataset',
      'monthset'
    ],
    count = 0;

    data.forEach(function(element, index, array) {
      client.llen(element, function(err, reply) {
        var i = 0;
        model[element] = [];

        for (i = 0; i < reply; i++) {
          client.lindex(element, i, function(err, reply) {
            model[element].push(parseInt(reply, 10));
          });
        }
      });
      count++;
      if (count === data.length) {
        callback(null, model);
      }
    });
  }

  app.get('/status', function(req, res) {
    async.series([
      readAllData,
      parseIntData,
      readArrayData
    ], function() {
      res.json(model);
    });
  });

};
