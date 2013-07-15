exports['test_QueryWithParams'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

	var sql = 'select * from nation where continent = ?';
	var arrValues = ['Oceania'];

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: ' + sql);
      client.queryWithParams(sql, arrValues, [], function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          test.ok(Result2Array.TotalRowsCount(result) === 15);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr[0].toString() === 'KIR,Kiribati,Oceania,Tarawa');
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
        }
      });
    }
  });
};

