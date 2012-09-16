var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

function errorHandler(err) {
  throw err.message;
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.getEngineVersion(function (err, result) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('CUBRID engine version: ' + result);
    CUBRIDClient.close(function (err) {
      if (err) {
        errorHandler(err);
      } else {
        assert(result.startsWith('8.4.1.') == true);
        Helpers.logInfo('Connection closed.');
        Helpers.logInfo('Test passed.');
      }
    });
  }
});


