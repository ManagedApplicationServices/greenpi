'use strict';

var expect = require('expect.js'),
  configFile = require('../../lib/configFile');

describe('Config File', function() {

  it('returns an object', function(done) {
    expect(configFile.get()).to.be.an('object');
    done();
  });

  it('returns a paperUsagePath', function(done) {
    expect(configFile.get().paperUsagePath).to.be.equal('/web/guest/en/websys/status/getUnificationCounter.cgi');
    done();
  });

  it('returns a machineDetailPath', function(done) {
    expect(configFile.get().machineDetailPath).to.be.equal('/web/guest/en/websys/status/configuration.cgi');
    done();
  });

});
