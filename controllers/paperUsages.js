'use strict';

var path = require('path');
var PaperUsageModel = require('../models/paperUsage');

module.exports = function (app) {

  var usage = new PaperUsageModel();

  app.get('/usages', function (req, res) {
    res.json('index', usage)
  });

};
