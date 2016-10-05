exports['test_QueryWithTypedParams'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array,
			sql = 'select * from nation where continent = ?',
			arrValues = ['Oceania'];

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
      client.queryWithTypedParams(sql, arrValues, ['varchar'], function (err, result, queryHandle) {
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
