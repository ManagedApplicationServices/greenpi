var path = require('path');
GLOBAL.Redis = require("redis").createClient();

GLOBAL.request   = require('supertest'),
GLOBAL.expect    = require('chai').expect;
GLOBAL.app       = require('../index');
GLOBAL.kraken    = require('kraken-js');
GLOBAL.appPath   = path.dirname(__dirname);
GLOBAL.testPath  = path.join(GLOBAL.appPath, "test");

require('chai').should();

before(function (done) {
  GLOBAL.Redis.select("1");
  kraken.create(GLOBAL.app).listen(9001, function (err, krakenServer) {
    GLOBAL.server = krakenServer;
    done(err);
  });
});

after(function (done) {
  GLOBAL.server.close(done);
  GLOBAL.Redis.quit();
});

