'use strict';

var path = require('path');
var PaperUsageModel = require('../models/paperUsage');
var redis = require('redis');
var client = redis.createClient();

module.exports = function (app) {

  var usages = {
    paperCapPerPrinterPerYear: 0,
    paperRemaining: 0,
    simulation: '',
    simulationStartAt: '',
    monthset: [],
    dataset: []
  };

  app.get('/usages', function (request, response) {

    client.select(0, function(error,res){
      if(error) return error;

      client.get('paperCapPerPrinterPerYear', function(err, reply) {
        usages.paperCapPerPrinterPerYear = parseInt(reply);
      });

      client.get('paperRemaining', function(err, reply) {
        usages.paperRemaining = parseInt(reply);
      });

      client.get('simulation', function(err, reply) {
        usages.simulation = reply;
      });

      client.get('simulationStartAt', function(err, reply) {
        usages.simulationStartAt = reply;
      });

      client.llen('monthset', function(err, reply){
        var i = 0;
        usages.monthset = [];
        for(i = 0; i < reply; i++) {
          client.lindex('monthset', i, function(err, reply) {
            usages.monthset.push(parseInt(reply));
          });
        }
      });

      client.llen('dataset', function(err, reply){
        var i = 0;
        usages.dataset = [];

        for(i = 0; i < reply; i++) {
          client.lindex('dataset', i, function(err, reply) {
            usages.dataset.push(parseInt(reply));
          });
        }
      });

      response.json(usages);

    });

  });



};
