'use strict';
require('../test-helper');

describe('index', function () {
  it('should say "hello"', function (done) {
    request(server)
    .get('/')
    .expect(200)
    .expect('Content-Type', /html/)
    .expect(/Hello, /)
    .end(function(err, res){
      done(err);
    });
  });

});
