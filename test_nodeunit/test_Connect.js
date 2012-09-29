var CUBRIDClient = require('./testSetup/test_Setup').testClient,
  Helpers = require('../src/utils/Helpers');

exports['test_Connect'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected OK.');
      CUBRIDClient.getEngineVersion(function (err, result) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('CUBRID engine version: ' + result);
          CUBRIDClient.close(function (err) {
            if (err) {
              errorHandler(err);
            } else {
              Helpers.logInfo('Connection closed.');
              Helpers.logInfo('Test passed.');
              test.done();
            }
          })
        }
      })
    }
  });
}

