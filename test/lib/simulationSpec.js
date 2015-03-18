'use strict';

var expect = require('chai').expect;
var simulationLib = require('../../lib/simulation');

describe('from Simulation Library', function() {
  describe('#setDemoMode', function() {

    describe('when app is online and connected to the Internet', function() {

      it('returns demo "false"', function(done) {
        var model = {};

        simulationLib.setDemoMode(model, function(error, reply) {
          expect(reply.demo).to.be.false;
          expect(error).to.not.exist;
          done();
        })
      })

    })

  })

})
