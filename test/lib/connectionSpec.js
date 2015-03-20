'use strict';

var expect = require('chai').expect;
var connectionLib = require('../../lib/connection');

describe('From Connection Library', function() {
  describe('#isAvailable', function() {
    it.skip('returns true when printer ip is available', function(done) {
      var forest = {
        printerIP: '172.19.107.61',
        demo: false
      }
      var logger = {
        info: console.log,
        error: console.log
      }
      connectionLib.isAvailable(forest, logger, function(isAvailable) {
        expect(isAvailable).to.be.true;
        done();
      })
    })
  })
})
