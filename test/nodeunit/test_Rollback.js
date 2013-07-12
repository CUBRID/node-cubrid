var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array;

function errorHandler(err) {
  throw err.message;
}

exports['test_Rollback'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connection connected');
      client.batchExecuteNoQuery(['drop table if exists node_test', 'create table node_test(id int)'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.setAutoCommitMode(false, function (err) {
            if (err) {
              errorHandler(err);
            } else {
              client.batchExecuteNoQuery(['insert into node_test values(1)'], function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  client.rollback(function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      client.query('select * from node_test', function (err, result) {
                        if (err) {
                          errorHandler(err);
                        } else {
                          test.ok(Result2Array.TotalRowsCount(result) !== 1, 'Didn\'t rollback!!!');

	                        client.setAutoCommitMode(true, function (err) {
                            if (err) {
                              errorHandler(err);
                            } else {
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
        }
      });
    }
  });
};
