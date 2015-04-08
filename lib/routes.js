'use strict';

var forestLib = require('./forest');

function start(model, callback) {
  forestLib.setDemoMode(model, function() {
    forestLib.getPrinterCap(model, function() {
     forestLib.getSimulationStatus(model, function() {
       return callback(model);
     })
   })
  })
}

function getStatus(model, callback) {
  forestLib.getAllData(model, function(error, model) {
    if (error) {
      console.log('Error: ' + error);
      return;
    }
    forestLib.parseIntData(model, function(error, model) {
      if (error) {
        console.log('Error: ' + error);
        return;
      }
      forestLib.getArrayData(model, function(error, model) {
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
