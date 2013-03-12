var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_PrimaryKeys'] = function (test) {
  test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_PRIMARY_KEY, 'athlete', callback);
      },

      function (result, callback) {
        for (var i = 0; i < result.length; i++) {
          Helpers.logInfo(result[i]);
        }
        test.ok(result.length === 1);
        test.ok(result[0].TableName === 'athlete');
        test.ok(result[0].ColumnName === 'code');
        test.ok(result[0].KeyName === 'pk_athlete_code');
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
