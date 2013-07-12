var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
    CAS = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/CASConstants');

function errorHandler(err) {
  throw err.message;
}

exports['test_SetDbParameter'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected OK.');

      client.setDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL, CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE, function (err) {
          if (err) {
            errorHandler(err);
          } else {
            client.close(function (err) {
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
