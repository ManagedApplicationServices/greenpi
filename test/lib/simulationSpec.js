'use strict';

var expect = require('chai').expect;
var forestLib = require('../../lib/forest');

describe('from Simulation Library', function() {
  describe('#setDemoMode', function() {

    describe('when app is online and connected to the Internet', function() {

      it('returns demo "false"', function(done) {
        var model = {};

        forestLib.setDemoMode(model, function(error, reply) {
          expect(reply.demo).to.be.false;
          expect(error).to.not.exist;
          done();
        })
      })

    })

  })

})
