var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

function errorHandler(err) {
  throw err.message;
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
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
                CUBRIDClient.rollback(function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    CUBRIDClient.query('select * from node_test', function (err, result) {
                      if (err) {
                        errorHandler(err);
                      } else {
                        assert(Result2Array.TotalRowsCount(result) !== 1, 'Didn\'t rollback!!!');
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

