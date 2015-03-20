'use strict';

var simulationLib = require('./simulation');
var async = require('async');

function start(model, callback) {
  simulationLib.setDemoMode(model, function() {
    simulationLib.getPrinterCap(model, function() {
     simulationLib.getSimulationStatus(model, function() {
       return callback(model);
     })
   })
  })
}

function getStatus(model, callback) {
  simulationLib.readAllData(model, function() {
    simulationLib.parseIntData(model, function() {
      simulationLib.readArrayData(model, function() {
        return callback(model);
      })
    })
  })
}

exports.start = start;
exports.getStatus = getStatus;
