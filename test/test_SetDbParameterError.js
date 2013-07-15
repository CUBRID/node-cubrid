exports['test_SetDbParameterError'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			CAS = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/CASConstants');

	test.expect(1);
  function errorHandler(err) {
    Helpers.logInfo(err.message);

	  test.ok(err.message === '-1011:CAS_ER_PARAM_NAME');

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

  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected OK.');
      client.setDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH, 99, function (err) {
        if (err) {
          errorHandler(err);
        } else {
          throw 'We should not get here';
        }
      });
    }
  });
};
