'use strict';

var MessageModel = require('../models/message');

module.exports = function (app) {

  var model = new MessageModel();

  app.get('/messages', function (req, res) {
    res.json('index', model)
  });

};
