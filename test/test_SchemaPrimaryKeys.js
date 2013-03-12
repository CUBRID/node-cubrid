var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../src/utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

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
      assert(result.length === 1);
      assert(result[0].TableName === 'athlete');
      assert(result[0].ColumnName === 'code');
      assert(result[0].KeyName === 'pk_athlete_code');
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
