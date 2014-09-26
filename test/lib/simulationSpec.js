'use strict';

var expect = require('expect.js'),
  simulation = require('../../lib/simulation');

describe('Forest', function() {

  it('returns a demo printer model if in demo mode', function(done) {
    var data = {
      demo: true
    };

    forest.getPrinterInfo(data, function(forest) {
      expect(forest.printerModel).to.equal('printer');
      done();
    });
  });

  it('returns a demo printer ID if in demo mode', function(done) {
      var data = {
        demo: true
      };

      forest.getPrinterInfo(data, function(forest) {
        expect(forest.printerID).to.equal('demo');
        done();
      });
    });

  it('returns the printer model if not in demo mode', function(done) {
    var data = {
      demo: false,
      printerInfoUrl: 'http://localhost:8080/printer-info.html'
    };

    forest.getPrinterInfo(data, function(forest) {
      expect(forest.printerModel).to.equal('MP C6502');
      done();
    });

  });

  it('returns the printer ID if not in demo mode', function(done) {
    var data = {
      demo: false,
      printerInfoUrl: 'http://localhost:8080/printer-info.html'
    };

    forest.getPrinterInfo(data, function(forest) {
      expect(forest.printerID).to.equal('E233C850036');
      done();
    });

  });

});
