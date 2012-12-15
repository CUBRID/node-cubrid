var assert = require('assert'),
  CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers');

var client = new CUBRIDConnection('localhost', 33000, 'public', 'xyz', 'demodb_xyz');

Helpers.logInfo(module.filename.toString() + ' started...');

client.connect(function (err) {
  if (err) {
    assert(err.message === '-677:Failed to connect to database server, \'demodb_xyz\', on the following host(s): localhost:localhost');
    Helpers.logInfo('Test passed.');
  } else {
    throw 'We should not get here!';
  }
});

