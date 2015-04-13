'use strict';

var config = require('../config');

module.exports = function AdminModel() {
  return {
    printerIP: config.printerIP,
    paperUsageCap: config.paperUsageCap,
    totalPrinters: config.greenpiIP.length
  };
};
