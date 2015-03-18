'use strict'

var basicAuth = require('basic-auth');
var bcrypt = require('bcrypt');
var config = require('../config');
var fs = require('fs');

var authenticate = function(req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  }

  var user = basicAuth(req);
  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  var usernameCheck = config.username;
  var passwordHash = config.passwordHash;

  if (user.name === usernameCheck) {
    bcrypt.compare(user.pass, passwordHash, function(err, response) {
      if (err || !response) {
        return unauthorized(res);
      }
      return next();
    });
  } else {
    return unauthorized(res);
  }
}

function createNewConfigFile(newConfig) {
  var fileName = './config.js';
  var dataToWrite = 'module.exports = ' + JSON.stringify(newConfig, null, 2);

  fs.exists(fileName, function(exists) {
    if (!exists) {
      console.log('Error, file foo.txt does not exist!');
    }

    fs.writeFile(fileName, dataToWrite, function(err) {
      if (err) {
        console.log(err);
      }
      return;
    });
  });

}

function createNewConfig(config, req) {
  var newConfig = config;

  if (req.printerIP) {
    newConfig.printerIP = req.printerIP;
  }

  if (req.paperUsageCap) {
    newConfig.paperUsageCap = parseInt(req.paperUsageCap);
  }

  if (req.totalPrinters) {
    newConfig.totalPrinters = parseInt(req.totalPrinters);
  }

  if (req.password) {
    if (req.password === req.passwordConfirm) {
      bcrypt.hash(req.password, 8, function(err, hash) {
        newConfig.passwordHash = hash;
        createNewConfigFile(newConfig);
      });
    } else {
      createNewConfigFile(newConfig);
    }
  } else {
    createNewConfigFile(newConfig);
  }
}

function transferUploadedImages(uploadedImages, res, config) {
  var newPath = '';
  var i = 0;

  function displayError(error) {
    var errorMessage = 'Ah crap! Could not load image :(';
    if (error) {
      res.send({
        error: errorMessage
      });
      return;
    }
  }

  for (i in uploadedImages) {
    if (uploadedImages[i].size > 0) {
      newPath = config.appPath + '/public/img/' + i + '.jpg';
      require('fs').rename(uploadedImages[i].path, newPath, displayError);
    }
  }
}

function insertToModel(model, req) {

  if (req.body.printerIP) {
    model.printerIP = req.body.printerIP;
  }

  if (req.body.paperUsageCap) {
    model.paperUsageCap = req.body.paperUsageCap;
  }

  if (req.body.totalPrinters) {
    model.totalPrinters = req.body.totalPrinters;
  }

  if (req.files.logo.size > 0) {
    model.logo = true;
  }

  if (req.files.poster1.size > 0) {
    model.poster1 = true;
  }

  if (req.files.poster2.size > 0) {
    model.poster2 = true;
  }

  if (req.files.poster3.size > 0) {
    model.poster3 = true;
  }

  if (req.files.poster4.size > 0) {
    model.poster4 = true;
  }

  if (req.files.poster5.size > 0) {
    model.poster5 = true;
  }

  if (req.body.password) {
    if (req.body.password === req.body.passwordConfirm) {
      model.password = 'Password reset successful';
    } else {
      model.password = 'Password reset not successful';
    }
  }

  return model;
}

exports.authenticate = authenticate;
exports.createNewConfig = createNewConfig;
exports.transferUploadedImages = transferUploadedImages;
exports.insertToModel = insertToModel;
