'use strict';

var redis = require('redis');
var client = redis.createClient();

var IndexModel = require('../models/index');
var PaperUsageModel = require('../models/paperUsage');

module.exports = function (app) {

  var model = new IndexModel();
  var usage = new PaperUsageModel();

  var subtitle = '';

  client.set('subtitle', 'raising environmental consciousness within an organization', redis.print);

  client.get('subtitle', function (err, reply) {
    subtitle = reply.toString();
  });

  app.get('/', function (req, res) {
    res.render('index',
      {
        model: model,
        subtitle: subtitle,
        usage: usage
      }
    );
  });

};
