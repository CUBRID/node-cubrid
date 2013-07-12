var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
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
    var sqlsArr = [];
    sqlsArr.push('drop table if exists node_test');
    sqlsArr.push('create table node_test(id int)');
    sqlsArr.push('insert into node_test values(2)');
    sqlsArr.push('drop table if exists node_test');
    CUBRIDClient.batchExecuteNoQuery(sqlsArr, function (err) {
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


