'use strict';

require('dotenv').load();
var expect = require('chai').expect;
var dbLib = require('../../lib/db');
var nconf = require('nconf').argv().env().file({
  file: './config/' + process.env.NODE_ENV + '.json'
});
var dbNum = parseInt(nconf.get(process.env.NODE_ENV).num);
var client = require('redis').createClient();

describe('From DB Library', function() {
  beforeEach(function(done) {
    client.select(dbNum, function() {
      client.flushdb();
      done();
    })
  })

  describe('#reset', function() {
    it('resets db', function(done) {
      dbLib.reset('reset', function() {
        client.select(dbNum, function() {
          client.get('simulation', function(reply) {
            expect(reply).to.be.null;
            done()
          })
        })
      })
    })
  })

  describe('#init', function() {
    it('initialises db', function(done) {
      var forest = {
        simulationStartDatetime: new Date(),
        maxPaperToPrint: 10000
      };

      dbLib.init(client, forest, function() {
        client.select(dbNum, function() {
          client.get('maxPaperToPrint', function(error, reply) {
            expect(reply).to.be.null;
            expect(error).to.be.null;
            done();
          })
        })
      })
    })
  })
})
