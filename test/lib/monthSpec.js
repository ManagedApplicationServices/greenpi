'use strict';

var expect = require('expect.js'),
  month = require('../../lib/month');

describe('Month', function() {

  describe('Check is new month', function() {
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

  describe('Get current month index', function() {

    it('returns a number', function(done) {
      expect(month.getCurrentMonthIndex()).to.be.an('number');
      done();
    });

    it('returns current month index', function(done) {
      var index = new Date().getMonth();
      expect(month.getCurrentMonthIndex()).to.equal(index);
      done();
    });

  });

  describe('Get current month year', function() {
    var MONTHS = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec'
    ];

    it('returns a string', function(done) {
      expect(month.getCurrentMonthYear()).to.be.a('string');
      done();
    });

    it('returns current month string in the first 3 characters', function(done) {
      var monthChar = MONTHS[new Date().getMonth()];
      expect(month.getCurrentMonthYear()).to.contain(monthChar);
      done();
    });

    it('returns current month string in the first 3 characters', function(done) {
      var monthChar = MONTHS[new Date().getMonth()];
      expect(month.getCurrentMonthYear().substring(0, 3)).to.equal(monthChar);
      done();
    });

    it('returns current year in the last 2 characters', function(done) {
      var yearString = new Date().getYear().toString().slice(-2);
      expect(month.getCurrentMonthYear().substring(3, 5)).to.equal(yearString);
      done();
    });

  });

});
