var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_SchemaClassPrivilege'] = function (test) {
  test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_CLASS_PRIVILEGE, null, callback);
      },

      function (result, callback) {
        for (var i = 0; i < 1; i++) {
          Helpers.logInfo(result[i]);
        }

        if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
          test.ok(result.length === 96);
        }
        else {
          if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
            test.ok(result.length === 97);
          }
        }
        test.ok(result[0].TableName === 'db_root');
        test.ok(result[0].Privilege === 'SELECT');
        test.ok(result[0].Grantable === false);
        CUBRIDClient.close(callback);
      }
    ],

    function (err) {
      if (err) {
        throw err.message;
      } else {
        Helpers.logInfo('Test passed.');
        test.done();
      }
    }
  );
};
