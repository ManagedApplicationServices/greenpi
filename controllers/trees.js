'use strict';

var TreeModel = require('../models/tree');

module.exports = function (app) {

  var model = new TreeModel();

  app.get('/trees', function (req, res) {
    res.json('trees', model)
  });

};
