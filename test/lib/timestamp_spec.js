'use strict'

var expect = require('expect.js'),
  timestamp = require('../../lib/timestamp');

describe('Timestamp', function(){

  it('returns a string', function(done){
    expect(timestamp.get()).to.be.a('string');
    done();
  });

  it('returns the current year as the first 4 character', function(done){
    var year = new Date().getFullYear();

    expect(timestamp.get().substring(0,4)).to.equal('2014');
    done();
  });

});
