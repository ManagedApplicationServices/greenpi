'use strict';

var expect = require('expect.js'),
  configFile = require('../../lib/configFile');

describe('Config File', function() {

  describe('Get', function() {
    it('returns an object', function(done) {
      expect(configFile.get()).to.be.an('object');
      done();
    });

    it('returns a paperUsagePath', function(done) {
      expect(configFile.get().paperUsagePath).to.be.equal('/web/guest/en/websys/status/getUnificationCounter.cgi');
      done();
    });

    it('returns a machineDetailPath', function(done) {
      expect(configFile.get().machineDetailPath).to.be.equal('/web/guest/en/websys/status/configuration.cgi');
      done();
    });
  });

  describe('Set forest', function() {

    var forest = {},
      config = {};

    beforeEach(function(done) {
      forest = {};
      config = {
        'printerIP': '172.19.107.61',
        'paperUsageCap': 1000,
        'totalPrinters': 4,
        'interval': 5000,
        'paperUsagePath': '/web/guest/en/websys/status/getUnificationCounter.cgi',
        'machineDetailPath': '/web/guest/en/websys/status/configuration.cgi'
      };
      done();
    });

    it('returns an object', function(done) {
      expect(configFile.initForest(forest, config)).to.be.an('object');
      done();
    });

    it('returns a complete printer URL', function(done) {
      var url = 'http://' + config.printerIP + config.paperUsagePath;

      expect(configFile.initForest(forest, config).completePrinterURL).to.be.a('string');
      expect(configFile.initForest(forest, config).completePrinterURL).to.equal(url);

      done();
    });

    it('returns printer info URL', function(done) {
      var url = 'http://' + config.printerIP + config.machineDetailPath;

      expect(configFile.initForest(forest, config).printerInfoUrl).to.be.a('string');
      expect(configFile.initForest(forest, config).printerInfoUrl).to.equal(url);

      done();
    });

    it('return max paper to print per printer', function(done) {
      var max = parseInt(config.paperUsageCap, 10) / parseInt(config.totalPrinters, 10);

      expect(configFile.initForest(forest, config).maxPaperToPrint).to.be.a('number');
      expect(configFile.initForest(forest, config).maxPaperToPrint).to.equal(max);

      done();
    });

    it('returns interval for scraping printer data', function(done) {
      expect(configFile.initForest(forest, config).interval).to.be.a('number');
      expect(configFile.initForest(forest, config).interval).to.equal(parseInt(config.interval, 10));
      done();
    });

  });

});
