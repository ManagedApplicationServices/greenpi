'use strict'

var basicAuth = require('basic-auth');
var bcrypt = require('bcrypt');
var config = require('../config');
var fs = require('fs');
var forestLib = require('./forest');

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

  [
    'logo',
    'poster1',
    'poster2',
    'poster3',
    'poster4',
    'poster5'
  ].forEach(function(image) {
    if (req.files[image].size > 0) {
      model[image] = true;
    }
  })

  if (req.body.password) {
    if (req.body.password === req.body.passwordConfirm) {
      model.password = 'Password reset successful';
    } else {
      model.password = 'Password reset not successful';
    }
  }

  return model;
}

function getIPofOtherPis(callback) {
  var allIP = config.greenpiIP
  forestLib.getIPAddress(function(error, ip) {
    allIP.splice(allIP.indexOf(ip), 1);
    callback(error, allIP);
  })
}

function updateAllPi(request, otherIPs, callback) {
  var body = request.body;
  delete body._csrf;
  delete body.setting;

  var options = {
    method: 'PUT',
    uri: 'http://192.168.1.133:8000/update',
    body: JSON.stringify(body),
    headers: {
      'Auth-Token': config.authToken,
      'Content-Length': JSON.stringify(body).length,
      'Content-Type': 'application/json'
    }
  };

  require('request')(options, function(error, response, body) {
    if (error) {
      return callback(error, null);
    }

    if ((response.statusCode === 200) && (JSON.parse(body).message === 'Successfully updated pi')) {
      callback(null, body);
    } else {
      callback(response, null);
    }
  })
}

exports.authenticate = authenticate;
exports.createNewConfig = createNewConfig;
exports.transferUploadedImages = transferUploadedImages;
exports.insertToModel = insertToModel;
exports.getIPofOtherPis = getIPofOtherPis;
exports.updateAllPi = updateAllPi;
