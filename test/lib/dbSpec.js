'use strict';

// var expect = require('chai').expect;
// var dbLib = require('../../lib/db');
// var nconf = require('nconf').argv().env().file({
//   file: './config/' + process.env.NODE_ENV + '.json'
// });
// var dbNum = parseInt(nconf.get(process.env.NODE_ENV).num);
// var client = require('redis').createClient();

// describe('From DB Library', function() {
//   beforeEach(function(done) {
//     client.select(dbNum, function(err) {
//       client.flushdb();
//       done();
//     })
//   })

//   describe('#reset', function() {
//     it('resets db', function(done) {
//       dbLib.reset('reset', function() {
//         client.select(dbNum, function(err) {
//           client.get('simulation', function(reply) {
//             expect(reply).to.be.null;
//             done()
//           })
//         })
//       })
//     })
//   })

//   describe.only('#init', function() {
//     it('initialises db', function(done) {
//       var forest = {
//         simulationStartDatetime: new Date(),
//         maxPaperToPrint: 10000
//       };

//       dbLib.init(forest, function() {
//         client.select(dbNum, function(err) {
//           client.get('maxPaperToPrint', function(error, reply) {
//             console.log(reply);
//             console.log(error);
//             done()
//           })
//         })
//       })
//     })
//   })
// })
