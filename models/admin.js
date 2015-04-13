'use strict';

var config = require('../config');

module.exports = function AdminModel() {
  config.greenpiList[config.thispiIndex].thispi = 'yes';

  return {
    printerIP: config.greenpiList[config.thispiIndex].printerIP,
    paperUsageCap: config.paperUsageCap,
    totalPrinters: config.greenpiList.length,
    greenpiList: config.greenpiList
  };
};
