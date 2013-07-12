var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		ActionQueue = CUBRID.ActionQueue,
    Result2Array = CUBRID.Result2Array;

exports['test_SchemaUsers'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.query('select [name] from db_user', callback);
    },
    function (result, queryHandle, callback) {
      Helpers.logInfo(Result2Array.ColumnNamesArray(result).toString());

	    var arr = Result2Array.RowsArray(result);
      test.ok(arr.length === 2);

	    for (var i = 0; i < arr.length; ++i) {
        Helpers.logInfo(arr[i].toString());
      }

      callback();
    },

    function (callback) {
      client.close(callback);
    }
  ],
  function (err) {
    if (err) {
      throw err.message;
    } else {
      Helpers.logInfo('Test passed.');
      test.done();
    }
  });
};
