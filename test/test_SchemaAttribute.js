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
      CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_ATTRIBUTE, null, callback);
    },

    function (result, callback) {
      for (var i = 0; i < result.length; i++) {
        Helpers.logInfo(result[i]);
      }

      if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
        assert(result.length === 191);
      }
      else {
        if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
          assert(result.length === 212);
        }
      }
      assert(result[0].Name === 'code');
      assert(result[0].Scale === 0);
      if (CUBRIDClient._DB_ENGINE_VER.startsWith('8.4')) {
        assert(result[0].Precision === 0);
      }
      else {
        if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
          assert(result[0].Precision === 10);
        }
      }
      assert(result[0].NonNull === true);
      assert(result[0].Unique === true);
      assert(result[0].ClassName === 'athlete');
      assert(result[0].SourceClass === 'athlete');
      assert(result[0].IsKey === true);
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
