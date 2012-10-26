var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
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
    sqlsArr.push('create table node_test(id xyz)');
    sqlsArr.push('create table node_test(id abc)');
    CUBRIDClient.batchExecuteNoQuery(sqlsArr, function (err) {
      assert(err.message == '-494:Semantic: xyz is not defined. create class node_test ( id xyz ) ');
      CUBRIDClient.close(function (err) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('Connection closed.');
          Helpers.logInfo('Test passed.');
        }
      })
    })
  }
});


