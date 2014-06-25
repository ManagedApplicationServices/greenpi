'use strict';

var SettingModel = require('../models/setting');
var config = {};
var file = '../config.json';

module.exports = function (router) {
    var model = new SettingModel();

    router.get('/admin', function (req, res) {
      res.render('setting', model);
    });

    router.post('/admin', function(req, res) {
      var companyLogoFile = req.files.companyLogo;
      var poster1File = req.files.poster1;
      var poster2File = req.files.poster2;
      var poster3File = req.files.poster3;
      var poster4File = req.files.poster4;
      var poster5File = req.files.poster5;
      var newPath = '';

      console.log(req.body.printerIp);
      console.log(req.body.organisationCap);
      console.log(req.body.totalPrinters);

      fs.readFile(file, 'utf8', function (err, data) {
        if (err) {console.log('Error: ' + err); return; }

        config = JSON.parse(data);


      });

      if(companyLogoFile.size > 0) {
        newPath = appPath + '/public/img/logo.jpg';
        require('fs').rename(companyLogoFile.path, newPath,
          function(error) {
            if(error) {res.send({ error: 'Ah crap! Something bad happened'}); return; }
          }
        );
      }

      if(poster1File.size > 0) {
        newPath = appPath + '/public/img/poster-1.jpg';
        require('fs').rename(poster1File.path, newPath,
          function(error) {
            if(error) {res.send({ error: 'Ah crap! Something bad happened'}); return; }
          }
        );
      }

      if(poster2File.size > 0) {
        newPath = appPath + '/public/img/poster-2.jpg';
        require('fs').rename(poster2File.path, newPath,
          function(error) {
            if(error) {res.send({ error: 'Ah crap! Something bad happened'}); return; }
          }
        );
      }

      if(poster3File.size > 0) {
        newPath = appPath + '/public/img/poster-3.jpg';
        require('fs').rename(poster3File.path, newPath,
          function(error) {
            if(error) {res.send({ error: 'Ah crap! Something bad happened'}); return; }
          }
        );
      }

      if(poster4File.size > 0) {
        newPath = appPath + '/public/img/poster-4.jpg';
        require('fs').rename(poster4File.path, newPath,
          function(error) {
            if(error) {res.send({ error: 'Ah crap! Something bad happened'}); return; }
          }
        );
      }

      if(poster5File.size > 0) {
        newPath = appPath + '/public/img/poster-5.jpg';
        require('fs').rename(poster5File.path, newPath,
          function(error) {
            if(error) {res.send({ error: 'Ah crap! Something bad happened'}); return; }
          }
        );
      }

      res.render('setting-done', model);
    });

};
