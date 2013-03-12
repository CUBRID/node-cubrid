var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  CAS = require('../../src/constants/CASConstants');

function errorHandler(err) {
  throw err.message;
}

exports['test_SetDbParameter'] = function (test) {
  test.expect(0);
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
