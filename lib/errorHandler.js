'use strict';

var parsetrace = require('parsetrace');
var dust = require('dustjs-linkedin');

function stacktrace(e) {
  var errors = JSON.parse(parsetrace(e, { sources: true }).json());
  return errors;
}

module.exports = function(template) {

  if (!dust.helpers) {
    dust.helpers = {};
  }

  return function serverError(err, req, res, next) {
    var model = {
      url: req.url,
      err: stacktrace(err),
      statusCode: 500,
      next: next
    };

    if (req.xhr) {
      res.status(500).send(model);
    } else {
      res.status(500);
      res.render(template, model);
    }
  };

};
