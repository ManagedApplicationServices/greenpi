'use strict';

var path = require('path');
var MessageModel = require('../models/message');

module.exports = function (app) {

  var message = new MessageModel();

  app.get('/messages', function (req, res) {
    res.json('index', message)
  });

};
