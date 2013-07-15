var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array'),
  assert = require('assert');

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
      for (var i = 0; i < result.length; i++) {
        Helpers.logInfo(result[i]);
      }
      assert(result.length === 1);
      assert(result[0].FkName === 'fk_game_athlete_code');
      assert(result[0].PkName === 'pk_athlete_code');
      assert(result[0].FkTableName === 'game');
      assert(result[0].PkTableName === 'athlete');
      assert(result[0].FkColumnName === 'athlete_code');
      assert(result[0].PkColumnName === 'code');
      assert(result[0].UpdateAction === 1);
      assert(result[0].DeleteAction === 1);
      CUBRIDClient.close(callback);
    }
  ],

  function (err) {
    if (err) {
      throw err.message;
    } else {
      Helpers.logInfo('Test passed.');
    }
  }
);
