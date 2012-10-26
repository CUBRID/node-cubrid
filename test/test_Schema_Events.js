var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

global.schemaTypes = [CUBRIDClient.SCHEMA_TABLE, CUBRIDClient.SCHEMA_VIEW, CUBRIDClient.SCHEMA_ATTRIBUTE ];
global.schemResults = [32, 16, 0];
var i = 0;

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect();

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logError('Error!: ' + err.message);
  throw 'We should not get here!';
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
  CUBRIDClient.getSchema(global.schemaTypes[i], null);
  i++;
});

CUBRIDClient.on(CUBRIDClient.EVENT_SCHEMA_DATA_AVAILABLE, function (result) {
  Helpers.logInfo('Schema data received.');
  Helpers.logInfo(JSON.stringify(result));
  assert(result.length === global.schemResults[i - 1]);
  if (i < 3) {
    CUBRIDClient.getSchema(global.schemaTypes[i], null);
    i++;
  } else {
    CUBRIDClient.close();
  }
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});


