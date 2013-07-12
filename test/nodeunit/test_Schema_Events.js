var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array,
		currentSchemaToReceive = 0;

exports['test_Schema_Events'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logError('Error!: ' + err.message);
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    client.getSchema(client.SCHEMA_TABLE, null, null);
    currentSchemaToReceive = client.SCHEMA_TABLE;
  });

  client.on(client.EVENT_SCHEMA_DATA_AVAILABLE, function (result) {
    Helpers.logInfo('Schema data received.');
    for (var i = 0; i < result.length; i++) {
      Helpers.logInfo(result[i]);
    }
    if (client._DB_ENGINE_VER.startsWith('8.4')) {
      if (currentSchemaToReceive === client.SCHEMA_TABLE) {
        test.ok(result.length === 32);
      } else {
        if (currentSchemaToReceive === client.SCHEMA_VIEW) {
          test.ok(result.length === 16);
        }
      }
    } else {
      if (client._DB_ENGINE_VER.startsWith('9')) {
        if (currentSchemaToReceive === client.SCHEMA_TABLE) {
          test.ok(result.length === 33);
        } else {
          if (currentSchemaToReceive === client.SCHEMA_VIEW) {
            test.ok(result.length === 17);
          }
        }
      }
    }
    if (currentSchemaToReceive === client.SCHEMA_TABLE) {
      client.getSchema(client.SCHEMA_VIEW, null);
      currentSchemaToReceive = client.SCHEMA_VIEW;
    } else {
      client.close();
    }
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};
