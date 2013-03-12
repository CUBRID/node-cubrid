var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_SchemaExportedKeys'] = function (test) {
  test.expect(9);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_EXPORTED_KEYS, 'athlete', callback);
      },

      function (result, callback) {
        for (var i = 0; i < 1; i++) {
          Helpers.logInfo(result[i]);
        }
        test.ok(result.length === 1);
        test.ok(result[0].FkName === 'fk_game_athlete_code');
        test.ok(result[0].PkName === 'pk_athlete_code');
        test.ok(result[0].FkTableName === 'game');
        test.ok(result[0].PkTableName === 'athlete');
        test.ok(result[0].FkColumnName === 'athlete_code');
        test.ok(result[0].PkColumnName === 'code');
        test.ok(result[0].UpdateAction === 1);
        test.ok(result[0].DeleteAction === 1);
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
