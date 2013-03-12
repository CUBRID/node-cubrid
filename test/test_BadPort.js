var assert = require('assert'),
  CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers');

var client = new CUBRIDConnection('localhost', 80, 'public', '', 'demodb');

Helpers.logInfo(module.filename.toString() + ' started...');

client.connect(function (err) {
  if (err) {

    assert(err.message === 'connect ECONNREFUSED');
    Helpers.logInfo('Test passed.');
  } else {
    throw 'We should not get here!';
  }
});

