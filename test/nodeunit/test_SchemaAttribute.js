var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_SchemaAttribute'] = function (test) {
  test.expect(9);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_ATTRIBUTE, null, callback);
      },

      function (result, callback) {
        for (var i = 0; i < 1; i++) {
          Helpers.logInfo(result[i]);
        }

        if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
          test.ok(result.length === 191);
        }
        else {
          if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
            test.ok(result.length === 212);
          }
        }
        test.ok(result[0].Name === 'code');
        test.ok(result[0].Scale === 0);
        if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
          test.ok(result[0].Precision === 0);
        }
        else {
          if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
            test.ok(result[0].Precision === 10);
          }
        }
        test.ok(result[0].NonNull === true);
        test.ok(result[0].Unique === true);
        test.ok(result[0].ClassName === 'athlete');
        test.ok(result[0].SourceClass === 'athlete');
        test.ok(result[0].IsKey === true);
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
