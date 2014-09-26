'use strict';

exports.getPrinterInfo = function getPrinterInfo(forest, callback) {
  var jsdom = require('jsdom'),
    timestamp = require('./timestamp'),
    fs = require('fs'),
    jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');

  if (!forest.demo) {

    jsdom.env({
      url: forest.printerInfoUrl,
      src: [
        jquery
      ],
      done: function(errors, window) {

        if (errors) {
          return timestamp.get() + 'jsDom scraping error: ' + errors;
        }

        forest.printerModel = window.$('.staticProp')
          .find('td:contains("Model Name")')
          .first()
          .next()
          .next()
          .text();

        forest.printerID = window.$('.staticProp')
          .find('td:contains("Machine ID")')
          .first()
          .next()
          .next()
          .text();

        callback(forest);
      }
    });
  } else {

    forest.printerModel = 'printer';
    forest.printerID = 'demo';
    callback(forest);

  }
};

exports.reset = function reset(forest) {
  forest.livePrinterCount = 0;
  forest.count = 0;
  forest.last = 0;
  forest.simulationStartDatetime = new Date();
  forest.offset = 0;
  return forest;
};
