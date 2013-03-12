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
  CUBRIDClient.getDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_GET_DB_PARAMETER_COMPLETED, function (value) {
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
  CUBRIDClient.close();
})
;

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});

