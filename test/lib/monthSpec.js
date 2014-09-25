'use strict';

var expect = require('expect.js'),
  month = require('../../lib/month');

describe('Month', function() {

  it('returns true if it is a new month', function(done) {
    var fourSecondsAfterNewMonth = new Date('June 1, 2014');
    fourSecondsAfterNewMonth.setHours(0);
    fourSecondsAfterNewMonth.setMinutes(0);
    fourSecondsAfterNewMonth.setSeconds(4);

    expect(month.isNew(fourSecondsAfterNewMonth)).to.be.true;
    done();
  });

  it('returns false if it is not a new month', function(done) {
    var fiveSecondsAfterNewMonth = new Date('June 1, 2014');
    fiveSecondsAfterNewMonth.setHours(0);
    fiveSecondsAfterNewMonth.setMinutes(0);
    fiveSecondsAfterNewMonth.setSeconds(5);

    expect(month.isNew(fiveSecondsAfterNewMonth)).to.be.false;
    done();
  });

});
