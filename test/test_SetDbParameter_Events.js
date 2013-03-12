var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  CAS = require('../src/constants/CASConstants'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect();

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logInfo('Error: ' + err.message);
  throw 'We should not get here!';
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
  CUBRIDClient.setDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL,
    CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE,
    null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_SET_DB_PARAMETER_COMPLETED, function () {
  Helpers.logInfo('Set Db parameter completed.');
  CUBRIDClient.close();
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});

