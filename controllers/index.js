'use strict';

var IndexModel = require('../models/index');
var StatusModel = require('../models/status');
var AdminModel = require('../models/admin');

var routesLib = require('../lib/routes');
var adminLib = require('../lib/admin');
var config = require('../config');

module.exports = function(router) {
  var model = new IndexModel();
  var status = new StatusModel();
  var admin = new AdminModel();

  // GET
  router.get('/', function(req, res) {
    routesLib.start(model, function(reply) {
      res.render('index', reply);
    });
  })

  router.get('/status', function(req, res) {
    routesLib.getStatus(status, function(reply) {
      res.json(reply);
      res.end();
    });
  });

  router.get('/admin', adminLib.authenticate, function(req, res) {
    res.render('admin', admin);
  });

  // POST
  router.post('/admin', function(req, res) {
    if (req.body.setting === 'allpi') {
      adminLib.getIPofOtherPis(function(error, otherIPs) {
        adminLib.updateAllPi(req, otherIPs, function() {
          res.render('admin-done');
        })
      });
    } else {
      adminLib.createNewConfig(config, req.body);
      adminLib.transferUploadedImages(req.files, res, config);
      adminLib.insertToModel(model, req);
      res.render('admin-done');
    }
  })

  router.post('/reset', function(req, res) {
    res.render('reset');
  })

  // PUT - no csrf
  router.put('/update', function(req, res) {
    console.log(req.headers)
    console.log(req.response.body)
    res.json({ message: 'Success!!!!!' });
  })

};
