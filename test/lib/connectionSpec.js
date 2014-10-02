'use strict';

var expect = require('expect.js'),
  connection = require('../../lib/connection');

describe('Connection', function() {

  describe('Status', function() {
    it('returns true is the IP is available', function(done) {
      var forest = {
        printerIP: '8.8.8.8'
      };

      connection.isAvailable(forest, null, function(reply) {
        expect(reply).to.be.true;
      });

      done();
    });

    it('returns false is the IP not is available', function(done) {
      var forest = {
        printerIP: '172.19.107.61'
      };

      connection.isAvailable(forest, null, function(reply) {
        expect(reply).to.be.false;
      });

      done();
    });

  });

});
