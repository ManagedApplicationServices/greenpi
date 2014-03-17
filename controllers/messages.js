'use strict';

var path = require('path');

var MessageModel = require(path.join(appPath,'models' ,'message'));

module.exports = function (app) {

  var model = new MessageModel();

  app.get('/messages', function (req, res) {
    res.json('index', model)
  });

};
