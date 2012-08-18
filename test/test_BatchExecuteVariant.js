var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  throw err.message;
}

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    CUBRIDClient.batchExecuteNoQuery('drop table if exists node_test', function (err) {
      if (err) {
        errorHandler(err);
      } else {
        CUBRIDClient.batchExecuteNoQuery('create table node_test(id int)', function (err) {
          if (err) {
            errorHandler(err);
          } else {
            CUBRIDClient.batchExecuteNoQuery('insert into node_test values(1)', function (err) {
              if (err) {
                errorHandler(err);
              } else {
                CUBRIDClient.batchExecuteNoQuery('drop table node_test', function (err) {
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
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  }
});


