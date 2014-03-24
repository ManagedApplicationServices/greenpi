'use strict';

var IndexModel = require('../models/index');
var TreeModel = require('../models/tree');
var MessageModel = require('../models/message');

module.exports = function (app) {

  var model = new IndexModel();
  var tree = new TreeModel();
  var message = new MessageModel();
  console.log(message);

  app.get('/', function (req, res) {
    res.render('index',
      {
        model: model,
        trees: tree,
        messages: message
      }
    );
  });

};
