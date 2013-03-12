var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var SQL_A = 'SELECT * from nation';
var SQL_B = 'SELECT * from code';
var SQL_C = 'SELECT * from game';

CUBRIDClient.connect(function () {
});

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logError('Error!: ' + err.message);
  throw err;
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
  CUBRIDClient.addQuery(SQL_A, null);
  CUBRIDClient.addQuery(SQL_B, null);
  CUBRIDClient.addQuery(SQL_C, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle, sql) {
  Helpers.logInfo('Executed! - handle: ' + queryHandle);
  Helpers.logInfo('Query result for handle: ' + queryHandle + ': ' + result);
  var arr = Result2Array.RowsArray(result);
  switch (sql) {
    case SQL_A:
      assert(arr.length === 215);
      assert(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
      break;
    case SQL_B:
      assert(Result2Array.TotalRowsCount(result) === 6);
      assert(arr[0].toString() === 'X,Mixed');
      break;
    case SQL_C:
      assert(arr.length === 235);
      assert(arr[0].toString() === '2004,20021,14345,30116,NGR,B,2004-08-28T00:00:00.000Z');
  }
  CUBRIDClient.fetch(queryHandle, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('Fetch executed for queryHandle: ' + queryHandle);
  Helpers.logInfo('Fetch results for handle: ' + queryHandle + ': ' + result);
  CUBRIDClient.closeQuery(queryHandle, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
  Helpers.logInfo('Fetch executed for queryHandle: ' + queryHandle);
  Helpers.logInfo('There is no more data to fetch.');
  CUBRIDClient.closeQuery(queryHandle, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function (queryHandle) {
  Helpers.logInfo(queryHandle + ' was closed!');
  if (CUBRIDClient._queriesQueue.length === 0) {
    setTimeout(function () {
      CUBRIDClient.close();
    }, 1000);
  }
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});
