var CUBRIDClient = require('./testSetup/test_Setup').testClient,
  Helpers = require('../src/utils/Helpers');

function errorHandler(err) {
  throw err.message;
}

exports['test_GetEngineVersion_ImplicitConnect'] = function (test) {
  test.expect(1);
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
          test.ok(result.startsWith('8.4.1.') == true);
          Helpers.logInfo('Connection closed.');
          Helpers.logInfo('Test passed.');
          test.done();
        }
      });
    }
  });
}

