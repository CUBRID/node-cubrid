var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array,
		CAS = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/CASConstants');

exports['test_GetDbParameter_Events'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    client.getDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL, null);
  });

  client.on(client.EVENT_GET_DB_PARAMETER_COMPLETED, function (value) {
    var isolationLevel = '';

    if (typeof value === 'undefined') {
      throw "Db parameter retrieved unsuccessfully!";
    }

    switch (value) {
      case CAS.CUBRIDIsolationLevel.TRAN_UNKNOWN_ISOLATION:
        isolationLevel = 'TRAN_UNKNOWN_ISOLATION';
        break;
      case CAS.CUBRIDIsolationLevel.TRAN_COMMIT_CLASS_UNCOMMIT_INSTANCE:
        isolationLevel = 'TRAN_COMMIT_CLASS_UNCOMMIT_INSTANCE';
        break;
      case CAS.CUBRIDIsolationLevel.TRAN_COMMIT_CLASS_COMMIT_INSTANCE:
        isolationLevel = 'TRAN_COMMIT_CLASS_COMMIT_INSTANCE';
        break;
      case CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_UNCOMMIT_INSTANCE:
        isolationLevel = 'TRAN_REP_CLASS_UNCOMMIT_INSTANCE';
        break;
      case CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE:
        isolationLevel = 'TRAN_REP_CLASS_COMMIT_INSTANCE';
        break;
      case CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_REP_INSTANCE:
        isolationLevel = 'TRAN_REP_CLASS_REP_INSTANCE';
        break;
      case CAS.CUBRIDIsolationLevel.TRAN_SERIALIZABLE:
        isolationLevel = 'TRAN_SERIALIZABLE';
        break;
    }

    if (isolationLevel === '') {
      throw "Db parameter value is not recognized!";
    }

    Helpers.logInfo('Get Db parameter completed: ' + isolationLevel);
    client.close();
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};
