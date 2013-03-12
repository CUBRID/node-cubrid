var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_SchemaUsers'] = function (test) {
  test.expect(1);
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
        test.ok(arr.length === 2);
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
        test.done();
      }
    }
  );
};
