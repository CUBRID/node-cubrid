var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_SchemaImportedKeys'] = function (test) {
  test.expect(17);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (callback) {
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_IMPORTED_KEYS, 'game', callback);
      },

      function (result, callback) {
        for (var i = 0; i < result.length; i++) {
          Helpers.logInfo(result[i]);
        }
        test.ok(result.length === 2);
        if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
          test.ok(result[0].FkName === 'fk_game_athlete_code');
          test.ok(result[0].PkName === 'pk_athlete_code');
          test.ok(result[0].FkTableName === 'game');
          test.ok(result[0].PkTableName === 'athlete');
          test.ok(result[0].FkColumnName === 'athlete_code');
          test.ok(result[0].PkColumnName === 'code');
          test.ok(result[0].UpdateAction === 1);
          test.ok(result[0].DeleteAction === 1);
          test.ok(result[1].FkName === 'fk_game_event_code');
          test.ok(result[1].PkName === 'pk_event_code');
          test.ok(result[1].FkTableName === 'game');
          test.ok(result[1].PkTableName === 'event');
          test.ok(result[1].FkColumnName === 'event_code');
          test.ok(result[1].PkColumnName === 'code');
          test.ok(result[1].UpdateAction === 1);
          test.ok(result[1].DeleteAction === 1);
        }
        else {
          if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
            test.ok(result[0].FkName === 'fk_game_event_code');
            test.ok(result[0].PkName === 'pk_event_code');
            test.ok(result[0].FkTableName === 'game');
            test.ok(result[0].PkTableName === 'event');
            test.ok(result[0].FkColumnName === 'event_code');
            test.ok(result[0].PkColumnName === 'code');
            test.ok(result[0].UpdateAction === 1);
            test.ok(result[0].DeleteAction === 1);
            test.ok(result[1].FkName === 'fk_game_athlete_code');
            test.ok(result[1].PkName === 'pk_athlete_code');
            test.ok(result[1].FkTableName === 'game');
            test.ok(result[1].PkTableName === 'athlete');
            test.ok(result[1].FkColumnName === 'athlete_code');
            test.ok(result[1].PkColumnName === 'code');
            test.ok(result[1].UpdateAction === 1);
            test.ok(result[1].DeleteAction === 1);
          }
        }
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
