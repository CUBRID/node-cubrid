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
      CUBRIDClient.query('select [name] from db_user', callback);
    },

    function (result, queryHandle, callback) {
      Helpers.logInfo(Result2Array.ColumnNamesArray(result).toString());
      var arr = Result2Array.RowsArray(result);
      assert(arr.length === 2);
      for (var i = 0; i < arr.length; i++) {
        Helpers.logInfo(arr[i].toString());
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
    }
  }
);
