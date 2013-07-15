exports['test_SetDbParameter_Events'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			CAS = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/CASConstants');

	test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    client.setDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL,
      CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE,
      null);
  });

  client.on(client.EVENT_SET_DB_PARAMETER_COMPLETED, function () {
    Helpers.logInfo('Set Db parameter completed.');
    client.close();
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};
