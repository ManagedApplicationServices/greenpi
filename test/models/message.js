'use strict';

require('../test-helper');
var path = require('path');

var Message = require(path.join(appPath, 'models', 'message'));
describe('message', function () {
  it('should work', function () {
    var message = new Message();
    expect(message).not.to.be.null;
  });

  it('should return messages', function() {
    var message = new Message();
    expect(message.getMessages()).to.have.length(3);
  });

});
