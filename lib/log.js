'use strict';

module.exports = require('tracer').colorConsole({
  format: '{{timestamp}} <{{title}}> ({{path}}:{{line}}) {{message}}',
  dateformat: 'HH:MM:ss'
});
