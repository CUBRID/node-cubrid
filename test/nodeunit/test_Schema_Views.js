var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_Schema_Views'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_VIEW, null, callback);
      },

      function (result, callback) {
        for (var i = 0; i < result.length; i++) {
          Helpers.logInfo(result[i]);
        }

        if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
          test.ok(result.length === 16);
        }
        else {
          if (CUBRIDClient._DB_ENGINE_VER.startsWith('9')) {
            test.ok(result.length === 17);
          }
        }

        callback();
      },

      function (callback) {
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
