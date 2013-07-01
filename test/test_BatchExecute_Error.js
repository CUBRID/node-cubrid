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
      if (err instanceof Array) { // Driver version in 8.4.3
        assert(err[0].message === '-494:Semantic: before \'  xyz)\'\nxyz is not defined. create class node_test ( id xyz ) ');
        assert(err[1].message === '-494:Semantic: before \'  abc)\'\nabc is not defined. create class node_test ( id abc ) ');
      } else {
        if (CUBRIDClient._DB_ENGINE_VER.startsWith('9.1')) {
          assert(err.message === '-494:Semantic: before \'  xyz)\'\nxyz is not defined. create class node_test ( id xyz ) ');
        } else {
          assert(err.message === '-494:Semantic: xyz is not defined. create class node_test ( id xyz ) ');
        }
      }
      CUBRIDClient.close(function (err) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('Connection closed.');
          Helpers.logInfo('Test passed.');
        }
      });
    });
  }
});


