'use strict';

var simulationLib = require('./simulation');
var async = require('async');

function start(model, callback) {
  async.series([
    function(next) {
      simulationLib.setDemoMode(model, function() {
        next();
      })
    },
    function(next) {
      simulationLib.getPrinterCap(model, function() {
        next();
      })
    },
    function(next) {
      simulationLib.getSimulationStatus(model, function() {
        next();
      })
    }
  ],
  function() {
    callback(model);
  })
}

function getStatus(model, callback) {
  async.series([
    function(next) {
      simulationLib.readAllData(model, function() {
        next();
      })
    },
    function(next) {
      simulationLib.parseIntData(model, function() {
        next()
      })
    },
    function() {
      simulationLib.readArrayData(model, function() {
        callback(model)
      })
    }
  ]);
}

exports.start = start;
exports.getStatus = getStatus;
