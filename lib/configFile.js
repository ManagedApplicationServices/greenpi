'use strict';

exports.get = function get() {
  var fs = require('fs'),
    path = require('path'),
    configFile = path.resolve(__dirname, '..', 'config.json');

  return JSON.parse(fs.readFileSync(configFile));
};
