exports['test_BigString'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Creating the test table...');
      client.batchExecuteNoQuery(
        [
          'drop table if exists test_big_string',
          'CREATE TABLE test_big_string(str char(1000000))',
          'INSERT INTO test_big_string VALUES(\'QWERTY\')'
        ],
        function (err) {
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Querying: select * from test_big_string');
            client.query('select * from test_big_string', function (err, result, queryHandle) {
              if (err) {
                errorHandler(err);
              } else {
                test.ok(Result2Array.TotalRowsCount(result) === 1);
                Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
                var arr = Result2Array.RowsArray(result);
                test.ok(arr.length === 1);
                test.ok(arr[0][0].startsWith('QWERTY') === true);
                test.ok(arr[0][0].length === 1000000);

                client.closeQuery(queryHandle, function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    Helpers.logInfo('Query closed.');
                    client.batchExecuteNoQuery('drop table test_big_string', function (err) {
                      if (err) {
                        errorHandler(err);
                      } else {
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
          }
        }
      );
    }
  });
};

