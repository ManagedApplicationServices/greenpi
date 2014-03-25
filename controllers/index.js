'use strict';

var redis = require('redis');
var client = redis.createClient();

var IndexModel = require('../models/index');
var TreeModel = require('../models/tree');
var MessageModel = require('../models/message');

module.exports = function (app) {

  var model = new IndexModel();
  var tree = new TreeModel();
  var message = new MessageModel();

  var subtitle = '';
  var tree1 = 0;

  client.set('subtitle', 'raising environmental consciousness within an organization', redis.print);

  client.get('subtitle', function (err, reply) {
    subtitle = reply.toString();
  });

  client.set('tree1', 100);

  client.decr('tree1', function (err, reply) {
    tree1 = reply;
  });

  app.get('/', function (req, res) {
    res.render('index',
      {
        model: model,
        trees: tree,
        messages: message,
        subtitle: subtitle,
        tree1: tree1
      }
    );
  });

};
