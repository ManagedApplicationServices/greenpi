'use strict';

var expect = require('expect.js'),
  simulation = require('../../lib/simulation');

describe('Simulation: ', function() {

  describe('Get printer info: ', function() {

    it('returns a demo printer model if in demo mode', function(done) {
      var data = {
        demo: true
      };

      simulation.getPrinterInfo(data, function(forest) {
        expect(forest.printerModel).to.equal('printer');
        done();
      });
    });

    it('returns a demo printer ID if in demo mode', function(done) {
        var data = {
          demo: true
        };

        simulation.getPrinterInfo(data, function(forest) {
          expect(forest.printerID).to.equal('demo');
          done();
        });
      });

    it('returns the printer model if not in demo mode', function(done) {
      var data = {
        demo: false,
        printerInfoUrl: 'http://localhost:8080/printer-info.html'
      };

      simulation.getPrinterInfo(data, function(forest) {
        expect(forest.printerModel).to.equal('MP C6502');
        done();
      });
    });

    it('returns the printer ID if not in demo mode', function(done) {
      var data = {
        demo: false,
        printerInfoUrl: 'http://localhost:8080/printer-info.html'
      };

      simulation.getPrinterInfo(data, function(forest) {
        expect(forest.printerID).to.equal('E233C850036');
        done();
      });
    });

  });

  describe('Reset: ', function() {

    var forest = {};

    beforeEach(function(done) {
      forest = {};
      done();
    });

    it('returns a forest object', function(done) {
      expect(simulation.reset(forest)).to.be.an('object');
      done();
    });

    it('returns zero for simulation livePrinterCount', function(done) {
      expect(simulation.reset(forest).livePrinterCount).to.be.zero;
      done();
    });

    it('returns zero for simulation count', function(done) {
      expect(simulation.reset(forest).count).to.be.zero;
      done();
    });

    it('returns zero for simulation last', function(done) {
      expect(simulation.reset(forest).last).to.be.zero;
      done();
    });

    it('returns current time for simulation start time', function(done) {
      var now = new Date();
      expect(simulation.reset(forest).simulationStartDatetime.toISOString()).to.be.equal(now.toISOString());
      done();
    });

    it('returns zero for simulation offset', function(done) {
      expect(simulation.reset(forest).offset).to.be.zero;
      done();
    });

  });

  describe('Get live printer count', function() {

    var forest = {
      completePrinterURL: 'http://localhost:8080/printer-count.html',
      livePrinterCount: 0
    };

    beforeEach(function(done) {
      forest.livePrinterCount = 0;
      done();
    });

    it('returns a forest object', function(done) {
      simulation.getLivePrinterCount(forest, function(reply) {
        expect(reply).to.be.an('object');
        done();
      });
    });

    it('return a printer live count number', function(done) {
      simulation.getLivePrinterCount(forest, function(reply) {
        expect(reply.livePrinterCount).to.be.a('number');
        done();
      });
    });

    it('return a printer live count', function(done) {
      simulation.getLivePrinterCount(forest, function(reply) {
        expect(reply.livePrinterCount).to.equal(299112);
        done();
      });
    });
  });

});
