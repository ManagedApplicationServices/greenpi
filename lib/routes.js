'use strict';

var forestLib = require('./forest');
var db = require('./db');
var client = require('./socket').client;

function start(model, callback) {
  forestLib.setDemoMode(model, function() {
    db.getPrinterCap(client, model, function() {
     db.getSimulationStatus(model, function() {
       return callback(model);
     })
   })
  })
}

function getStatus(model, callback) {
  db.getAllData(model, function(error, model) {
    if (error) {
      console.log('Error: ' + error);
      return;
    }
    forestLib.parseIntData(model, function(error, model) {
      if (error) {
        console.log('Error: ' + error);
        return;
      }
      db.getArrayData(model, function(error, model) {
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
