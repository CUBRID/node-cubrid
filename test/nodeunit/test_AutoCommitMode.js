var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

function errorHandler(err) {
  throw err.message;
}

exports['test_AutoCommitMode'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');
  test.expect(1);

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connection connected');
      CUBRIDClient.batchExecuteNoQuery(['drop table if exists node_test', 'create table node_test(id int)'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          CUBRIDClient.setAutoCommitMode(false, function (err) {
            if (err) {
              errorHandler(err);
            } else {
              CUBRIDClient.batchExecuteNoQuery(['insert into node_test values(1)'], function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  CUBRIDClient.commit(function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      CUBRIDClient.query('select * from node_test', function (err, result) {
                        if (err) {
                          errorHandler(err);
                        } else {
                          test.equal(Result2Array.TotalRowsCount(result), 1, 'Didn\'t commit!!!');
                          CUBRIDClient.setAutoCommitMode(true, function (err) {
                            if (err) {
                              errorHandler(err);
                            } else {
                              CUBRIDClient.batchExecuteNoQuery(['drop table node_test'], function (err) {
                                if (err) {
                                  errorHandler(err);
                                } else {
                                  CUBRIDClient.close(function (err) {
                                    if (err) {
                                      errorHandler(err);
                                    } else {
                                      Helpers.logInfo('Connection closed.');
                                      test.done();
                                      Helpers.logInfo('Test passed.');
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

