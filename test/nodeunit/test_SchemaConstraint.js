var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_SchemaConstraint'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_CONSTRAINT, 'event', callback);
      },

      function (result, callback) {
        for (var i = 0; i < 1; i++) {
          Helpers.logInfo(result[i]);
        }
        test.ok(result.length === 0);
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
