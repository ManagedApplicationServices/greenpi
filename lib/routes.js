'use strict';

var simulationLib = require('./simulation');

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
  simulationLib.getAllData(model, function(error, model) {
    if (error) {
      console.log('Error: ' + error);
      return;
    }
    simulationLib.parseIntData(model, function(error, model) {
      if (error) {
        console.log('Error: ' + error);
        return;
      }
      simulationLib.getArrayData(model, function(error, model) {
        if (error) {
          console.log('Error: ' + error);
          return;
        }
        return callback(model);
      })
    })
  })
}

exports.start = start;
exports.getStatus = getStatus;
