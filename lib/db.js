'use strict';
var client = require('redis').createClient();

exports.reset = function reset(resetParam, callback) {
  if (resetParam === 'reset') {
    client.select(0, function(err, res) {
      client.flushdb();
      callback(null);
    });
  } else {
    callback(null);
  }
};
