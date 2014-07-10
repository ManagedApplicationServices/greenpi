'use strict';

var path = require('path');
var PaperUsageModel = require('../models/paperUsage');
var redis = require('redis');
var async = require('async');
var client = redis.createClient();

module.exports = function (app) {
  var model = {
    paperCapPerPrinterPerYear: 0,
    paperRemaining: 0,
    simulation: '',
    simulationStartAt: '',
    currentTreeNum: 0,
    monthset: [],
    dataset: [],
    demo: 0
  };

  function readData(callback) {
    var data = [
      'paperCapPerPrinterPerYear',
      'currentTreeNum',
      'paperRemaining',
      'demo',
      'simulation',
      'simulationStartAt'
    ];
    var count = 0;

    data.forEach(function(element, index, array) {
      client.select(0, function(error,res){
        if(error) return error;
        client.get(element, function(err, reply) {
          model[element] = reply;
          count++;
          if(count === data.length) {
            callback(null, model);
          }
        });
      })
    });
  }

  function parseIntData(callback) {
    var data = [
      'paperCapPerPrinterPerYear',
      'currentTreeNum',
      'paperRemaining'
    ];
    var count = 0;

    data.forEach(function(element, index, array) {
      model[element] = parseInt(model[element]);
      count++;
      if(count === data.length) {
        callback(null, model);
      }
    })
  }

  function readArrayData(callback) {
    var data = [
      'dataset',
      'monthset'
    ];
    var count = 0;

    data.forEach(function(element, index, array) {
      client.llen(element, function(err, reply){
        var i = 0;
        model[element] = [];

        for(i = 0; i < reply; i++) {
          client.lindex(element, i, function(err, reply) {
            model[element].push(parseInt(reply));
          });
        }
      });
      count++;
      if(count === data.length) {
        callback(null, model);
      }
    });
  }

  app.get('/usages', function(req, res) {
    async.series([readData, parseIntData, readArrayData], function() {
      res.json(model);
    });
  });


};
