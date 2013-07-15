exports['test_SelectConstant_01'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: select 1');

	    client.query('select 1', function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          test.ok(Result2Array.TotalRowsCount(result) === 1);

	        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('Query results:');

	        var arr = Result2Array.RowsArray(result);

	        test.ok(arr.length === 1);
          test.ok(arr[0].toString() === '1');

	        for (var j = 0; j < arr.length; ++j) {
            Helpers.logInfo(arr[j].toString());
          }
        }
        client.closeQuery(queryHandle, function (err) {
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Query closed.');

	          client.close(function (err) {
              if (err) {
                errorHandler(err);
              } else {
                Helpers.logInfo('Connection closed.');
                Helpers.logInfo('Test passed.');
                test.done();
              }
            });
          }
        });
      });
    }
  });
};
