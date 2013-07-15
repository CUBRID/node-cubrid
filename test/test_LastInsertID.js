exports['test_LastInsertID'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

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

	    client.batchExecuteNoQuery(['drop table if exists node_test', 'create table node_test(id INT AUTO_INCREMENT NOT NULL PRIMARY KEY, text VARCHAR(32))'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.batchExecuteNoQuery(['insert into node_test values(NULL, \'database\'),(NULL, \'manager\')'], function (err) {
            if (err) {
              errorHandler(err);
            } else {
              client.query('select LAST_INSERT_ID()', function (err, result, queryHandle) {
                if (err) {
                  errorHandler(err);
                } else {
                  test.ok(Result2Array.TotalRowsCount(result) === 1);

	                var arr = Result2Array.RowsArray(result);

	                test.ok(arr[0].toString() === '1');

	                client.closeQuery(queryHandle, function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      Helpers.logInfo('Query closed.');

	                    client.batchExecuteNoQuery(['drop table node_test'], function (err) {
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
          });
        }
      });
    }
  });
};
