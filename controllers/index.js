'use strict';

var redis = require('redis');
var client = redis.createClient();
var fs = require('fs');
var jsdom = require('jsdom');
var config = {};
var configFile = './config.json';
var jquery = fs.readFileSync('./js/vendor/jquery/dist/jquery.min.js', 'utf-8');

var IndexModel = require('../models/index');
var PaperUsageModel = require('../models/paperUsage');

module.exports = function (app) {

  var model = new IndexModel();
  var usage = new PaperUsageModel();

  app.get('/', function (req, res) {

    fs.readFile(configFile, 'utf8', function (err, data) {
      config = JSON.parse(data);
      var completePrinterInfoURL = 'http://' + config.printerIP + config.machineDetailPath;

      jsdom.env({
        url: completePrinterInfoURL,
        src: [jquery],
        done: function (errors, window) {
          var printerModel = window.$('.staticProp').find("td:contains('Model Name')").first().next().next().text();
          var printerID = window.$('.staticProp').find("td:contains('Machine ID')").first().next().next().text();

          console.log('Printer model name: ');
          console.log(printerModel);

          console.log('Printer ID: ');
          console.log(printerID);

          res.render('index', {
            printerModel: printerModel,
            printerID: printerID
          });
        }
      });
    });



  });

};
