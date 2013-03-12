var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var SQL_A = 'SELECT * FROM event';
var SQL_B = 'SELECT * FROM record';

CUBRIDClient.connect();

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logError('Error!: ' + err.message);
  throw err;
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
  CUBRIDClient.addQuery(SQL_A, null);
  CUBRIDClient.addQuery(SQL_B, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle, sql) {
  Helpers.logInfo('[' + sql + '] executed - query handle is: ' + queryHandle);
  var arr = Result2Array.RowsArray(result);
  Helpers.logInfo('Query result first row: ' + arr[0]);
  switch (sql) {
    case SQL_A:
      assert(Result2Array.TotalRowsCount(result) === 422);
      assert(arr[0].toString() === '20421,Wrestling,Greco-Roman 97kg,M,1');
      break;
    case SQL_B:
      assert(Result2Array.TotalRowsCount(result) === 2000);
      assert(arr[0].toString() === '2000,20243,14214,G,681.1,Score');
  }
  Helpers.logInfo('...let\'s fetch more data...');
  CUBRIDClient.fetch(queryHandle);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('Fetch executed for queryHandle: ' + queryHandle);
  var arr = Result2Array.RowsArray(result);
  Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
  CUBRIDClient.closeQuery(queryHandle, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
  Helpers.logInfo('There is no more data to fetch for query with handle: ' + queryHandle);
  CUBRIDClient.closeQuery(queryHandle, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function (queryHandle) {
  Helpers.logInfo('Query with handle: ' + queryHandle + ' was closed!');
  if (CUBRIDClient.queriesQueueIsEmpty()) {
    CUBRIDClient.close();
  } else {
    Helpers.logInfo('(...it\'s not the right time to close the connection! - there are some queries still pending execution...)');
  }
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});
