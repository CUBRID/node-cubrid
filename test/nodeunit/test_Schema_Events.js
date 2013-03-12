var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var currentSchemaToReceive = 0;

exports['test_Schema_Events'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect();

  CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
    Helpers.logError('Error!: ' + err.message);
    throw 'We should not get here!';
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_TABLE, null, null);
    currentSchemaToReceive = CUBRIDClient.SCHEMA_TABLE;
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_SCHEMA_DATA_AVAILABLE, function (result) {
    Helpers.logInfo('Schema data received.');
    for (var i = 0; i < result.length; i++) {
      Helpers.logInfo(result[i]);
    }
    if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
      if (currentSchemaToReceive === CUBRIDClient.SCHEMA_TABLE) {
        test.ok(result.length === 32);
      } else {
        if (currentSchemaToReceive === CUBRIDClient.SCHEMA_VIEW) {
          test.ok(result.length === 16);
        }
      }
    } else {
      if (CUBRIDClient._DB_ENGINE_VER.startsWith('9')) {
        if (currentSchemaToReceive === CUBRIDClient.SCHEMA_TABLE) {
          test.ok(result.length === 33);
        } else {
          if (currentSchemaToReceive === CUBRIDClient.SCHEMA_VIEW) {
            test.ok(result.length === 17);
          }
        }
      }
    }
    if (currentSchemaToReceive === CUBRIDClient.SCHEMA_TABLE) {
      CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_VIEW, null);
      currentSchemaToReceive = CUBRIDClient.SCHEMA_VIEW;
    } else {
      CUBRIDClient.close();
    }
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    CUBRIDClient.removeAllListeners();
    test.done();
  });
};
