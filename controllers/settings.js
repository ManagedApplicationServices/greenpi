'use strict';

var SettingModel = require('../models/setting'),
  express = require('express'),
  config = {},
  configFile = './config.json',
  fs = require('fs'),
  bcrypt = require('bcrypt');

module.exports = function(app) {
  var model = {},
    auth = express.basicAuth(function(usernameInput, passwordInput, callback) {
    var result, username, passwordHash, hashCompare;

    fs.readFile(configFile, 'utf8', function(err, data) {
      if (err) {
        console.log('Error: ' + err);
        return;
      }
      username = JSON.parse(data).username;
      passwordHash = JSON.parse(data).passwordHash;

      bcrypt.compare(passwordInput, passwordHash, function(err, res) {
        result = (usernameInput === username && res);
        callback(null, result);
      });
    });

  });

  app.get('/admin', auth, function(req, res) {
    res.render('setting', model);
  });

  app.post('/admin', function(req, res) {
    var companyLogoFile = req.files.companyLogo,
      uploadedImages = [],
      i = 0;

    fs.readFile(configFile, 'utf8', function(err, data) {
      var newConfig = {};

      if (err) {console.log('Error: ' + err); return; }
      config = JSON.parse(data);

      // create new config file based on admin input
      createNewConfig(config, req.body);

      // transfer posters and logos based on admin upload
      transferUploadedImages(req.files, config);
      insertToModel(model, req);

      res.render('setting-done', model);
    });

  });

};

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

function transferUploadedImages(uploadedImages, config) {
  var newPath = '',
    i = 0;

  function displayError(error) {
    var errorMessage = 'Ah crap! Could not load image :(';
    if (error) {
      res.send( {
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

function createNewConfigFile(newConfig) {
  fs.writeFile(configFile, JSON.stringify(newConfig, null, 4), function(err) {
    if (err) {
      console.log(err);
    }
  });
}
