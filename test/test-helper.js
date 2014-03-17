var path = require('path');

GLOBAL.request   = require('supertest'),
GLOBAL.expect    = require('chai').expect;
GLOBAL.app       = require('../index');
GLOBAL.kraken    = require('kraken-js');
GLOBAL.appPath   = path.dirname(__dirname);
GLOBAL.testPath  = path.join(GLOBAL.appPath, "test");

require('chai').should();

before(function (done) {
  kraken.create(GLOBAL.app).listen(9000,function (err, krakenServer) {
    GLOBAL.server = krakenServer;
    done(err);
  });
});

after(function (done) {
  GLOBAL.server.close(done);
});

