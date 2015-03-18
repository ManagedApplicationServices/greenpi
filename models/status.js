'use strict';

module.exports = function StatusModel() {
  return {
    paperCapPerPrinterPerYear: 0,
    paperRemaining: 0,
    simulation: '',
    simulationStartAt: '',
    currentTreeNum: 0,
    monthset: [],
    dataset: [],
    demo: 0,
    printerID: '',
    printerModel: '',
    simulationCurrentTime: '',
    count: 0,
    livePrinterCount: 0
  };
};
