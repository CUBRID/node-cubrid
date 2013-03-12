var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers');

exports['test_SetAutoCommit'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected...');
      CUBRIDClient.setAutoCommitMode(false, function (err) {
        if (err) {
          errorHandler(err);
        } else {
          test.ok(CUBRIDClient.autoCommitMode === false, 'AutoCommitMode not set correctly!');
          CUBRIDClient.setAutoCommitMode(true, function (err) {
            if (err) {
              errorHandler(err);
            } else {
              test.ok(CUBRIDClient.autoCommitMode === true, 'AutoCommitMode not set correctly!');
              CUBRIDClient.close(function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  Helpers.logInfo('Connection closed...');
                  Helpers.logInfo('Test passed.');
                  test.done();
                }
              });
            }
          });
        }
      });
    }
  });
};

