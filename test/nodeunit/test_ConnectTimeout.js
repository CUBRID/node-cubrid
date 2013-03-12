var CUBRIDConnection = require('../../src/CUBRIDConnection'),
  ErrorMessages = require('../../src/constants/ErrorMessages'),
  Helpers = require('../../src/utils/Helpers');

//var client = new CUBRIDConnection('www.google.com', 81, 'public', '', 'demodb');
var client = new CUBRIDConnection('10.255.255.1', 33000, 'public', '', 'demodb');

exports['test_ConnectionTimeout'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.setConnectionTimeout(2000);
  client.connect(function (err) {
    if (err) {
      test.ok(err.message === ErrorMessages.ERROR_CONNECTION_TIMEOUT);
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};
