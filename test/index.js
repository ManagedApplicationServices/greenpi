'use strict';
require('./test-helper');


describe('index', function () {

  var mock;

  beforeEach(function (done) {
    kraken.create(app).listen(9000,function (err, server) {
      mock = server;
      done(err);
    });
  });

  afterEach(function (done) {
    mock.close(done);
  });

  it('should say "hello"', function (done) {
    request(mock)
    .get('/')
    .expect(200)
    .expect('Content-Type', /html/)
    .expect(/Hello, /)
    .end(function(err, res){
      done(err);
    });
  });

});
