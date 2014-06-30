'use strict';

var SettingModel = require('../models/setting');
var config = {};
var configFile = './config.json';
var fs = require('fs');

module.exports = function (app) {
  var model = new SettingModel();

  app.get('/admin', function (req, res) {
    res.render('setting', model);
  });

  app.post('/admin', function(req, res) {
    var companyLogoFile = req.files.companyLogo;
    var uploadedImages = new Array();
    var i = 0;

    console.log(req.files);
    console.log(req.body.printerIP);
    console.log(req.body.organisationCap);
    console.log(req.body.totalPrinters);

    fs.readFile(configFile, 'utf8', function (err, data) {
      if (err) {console.log('Error: ' + err); return; }
      config = JSON.parse(data);
      console.log('CONFIG:');
      console.log(config);

      // create new config file based on admin input
      var newConfig = createNewConfig(config, req.body);

      fs.writeFile(configFile, JSON.stringify(newConfig, null, 4), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log('JSON saved to ' + configFile);
        }
      });

      // transfer posters and logos based on admin upload
      transferUploadedImages(req.files, config);

    });

    res.render('setting-done', model);
  });

};

function transferUploadedImages(uploadedImages, config) {
  var newPath = '';

  for(var i in uploadedImages){
    // console.log(i); // key
    // console.log(uploadedImages[i]); // value

    if(uploadedImages[i].size > 0) {
      newPath = config.appPath + '/public/img/' + i + '.jpg';
      // console.log(newPath);
      require('fs').rename(uploadedImages[i].path, newPath,
        function(error) {
          var errorMessage = 'Ah crap! Could not load ' + i + ' :(';
          if(error) {
            res.send( {error: errorMessage } );
            return;
          }
        }
      );
    }

  }

}

function createNewConfig(config, req) {
  var newConfig = config;

  if(req.printerIP) {
    newConfig.printerIP = req.printerIP;
  }

  if(req.organisationCap) {
    newConfig.paperUsageCap = req.organisationCap;
  }

  if(req.totalPrinters) {
    newConfig.totalPrinters = req.totalPrinters;
  }

  return newConfig;
}
