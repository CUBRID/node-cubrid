var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  CAS = require('../../src/constants/CASConstants');

function errorHandler(err) {
  throw err.message;
}

exports['test_GetDbParameter'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected OK.');
      CUBRIDClient.setDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL,
        CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE, function (err) {
          if (err) {
            errorHandler(err);
          } else {
            CUBRIDClient.getDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL, function (err, value) {
              if (err) {
                errorHandler(err);
              } else {
                test.ok(value === CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE);
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
    }
  });
};
