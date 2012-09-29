var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  ErrorMessages = require('../src/constants/ErrorMessages'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function () {
  Helpers.logInfo('Connected the first time.');
  Helpers.logInfo('Connecting the second time...');
  CUBRIDClient.connect(function (err) {
    if (err != null) {
      Helpers.logInfo('Error: ' + err.message);
      assert(err.message == ErrorMessages.ERROR_CONNECTION_ALREADY_OPENED);
    } else {
      throw 'We should not get here!';
    }

    Helpers.logInfo('Closing first connection...');
    CUBRIDClient.close(function () {
      Helpers.logInfo('First connection closed.');
      Helpers.logInfo('Trying to close connection the second time...');
      CUBRIDClient.close(function (err) {
        if (err != null) {
          Helpers.logInfo('Error: ' + err.message);
          assert(err.message == ErrorMessages.ERROR_CONNECTION_ALREADY_CLOSED);
        } else {
          throw 'We should not get here!';
        }
      });
      Helpers.logInfo('Test passed.');
    });
  });
});

