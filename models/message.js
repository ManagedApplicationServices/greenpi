'use strict';

module.exports = function Message() {
  var messageModel = {}
  var self = messageModel = {
    messages : [
      { id: 1, content: 'Earth our home' },
      { id: 2, content: 'Shred paper, recycle!' },
      { id: 3, content: 'Use renewable forest' }
    ],
    getMessages : function() {
      return self.messages;
    }
  };
  return messageModel;
};
