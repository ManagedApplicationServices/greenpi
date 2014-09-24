'use strict';

exports.get = function get() {
  var dateFormat = require('dateformat'),
    now = new Date(),
    nowFormatted = dateFormat(now, 'yyyymmdd-HH-MM-ss') + ': ';

  return nowFormatted;
};
