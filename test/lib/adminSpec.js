'use strict';

var expect = require('chai').expect;
var adminLib = require('../../lib/admin');

describe('From Admin library', function() {
  describe('#insertToModel', function() {
    var model = {};

    beforeEach(function() {
      model =  {
        printerIP: '192.168.1.10',
        paperUsageCap: 10000,
        totalPrinters: 4,
        logo: false,
        poster1: false,
        poster2: false,
        poster3: false,
        poster4: false,
        poster5: false,
        password: ''
      }
    })

    describe('when printer ip is amended', function() {
      it('returns printer ip amended', function() {
        var req = {
          body: {
            printerIP: '192.168.1.20'
          },
          files: {
            poster1: {},
            poster2: {},
            poster3: {},
            poster4: {},
            poster5: {},
            logo: {}
          }
        }

        expect(model.printerIP).to.equal('192.168.1.10');
        adminLib.insertToModel(model, req)
        expect(model.printerIP).to.equal('192.168.1.20');
      })
    })

    describe('when printer cap is amended', function() {
      it('returns printer cap amended', function() {
        var req = {
          body: {
            paperUsageCap: 1000000
          },
          files: {
            poster1: {},
            poster2: {},
            poster3: {},
            poster4: {},
            poster5: {},
            logo: {}
          }
        }
        expect(model.paperUsageCap).to.equal(10000);
        adminLib.insertToModel(model, req)
        expect(model.paperUsageCap).to.equal(1000000);
      })
    })

    describe('when poster 1 is uploaded', function() {
      it('returns new poster', function() {
        var req = {
          body: {},
          files: {
            poster1: {
              size: 1
            },
            poster2: {},
            poster3: {},
            poster4: {},
            poster5: {},
            logo: {}
          }
        }
        expect(model.poster1).to.be.false;
        adminLib.insertToModel(model, req)
        expect(model.poster1).to.be.true;
      })
    })

    describe('when logo is uploaded', function() {
      it('returns new logo', function() {
        var req = {
          body: {},
          files: {
            logo: {
              size: 1
            },
            poster1: {},
            poster2: {},
            poster3: {},
            poster4: {},
            poster5: {}
          }
        }
        expect(model.logo).to.be.false;
        adminLib.insertToModel(model, req)
        expect(model.logo).to.be.true;
      })
    })
  })
})
