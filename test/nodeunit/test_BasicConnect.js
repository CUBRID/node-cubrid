var CUBRIDClient = require('../../index.js').createCUBRIDConnection('127.0.0.1', 33000, 'public', '', 'demodb'),
  Helpers = require('../../src/utils/Helpers');

function errorHandler(err) {
  throw err.message;
}

exports['test_BasicConnect'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

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
          });
        }
      });
    }
  });
};

