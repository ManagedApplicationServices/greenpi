'use strict';

exports.get = function get() {
  var dateFormat = require('dateformat');
  var now = new Date();
  var nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ';

  return nowFormatted;
};
