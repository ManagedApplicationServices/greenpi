'use strict';

var expect = require('expect.js'),
  random = require('../../lib/random');

describe('Random', function() {

  it('returns a number', function(done) {
    expect(random.num1to5()).to.be.a('number');
    done();
  });

  it('returns a number greater than 0', function(done) {
    expect(random.num1to5()).to.be.above(0);
    done();
  });

  it('returns a number below than 6', function(done) {
    expect(random.num1to5()).to.be.below(6);
    done();
  });

});
