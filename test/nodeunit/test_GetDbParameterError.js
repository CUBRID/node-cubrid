var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  CAS = require('../../src/constants/CASConstants');

exports['test_GetDbParameterError'] = function (test) {
  test.expect(1);
  function errorHandler(err) {
    Helpers.logInfo(err.message);
    test.ok(err.message === '-1011:CAS_ER_PARAM_NAME');
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

  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected OK.');
      CUBRIDClient.getDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH, function (err, value) {
        if (err) {
          errorHandler(err);
        } else {
          throw 'We should not get here';
        }
      });
    }
  });
};
