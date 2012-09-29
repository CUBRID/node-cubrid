var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array');

global.savedQueryHandle = null;

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect();

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logError('Error!: ' + err.message);
  throw 'We should not get here!';
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');

  Helpers.logInfo('Querying: select * from game');
  CUBRIDClient.query('select * from game');

  Helpers.logInfo('Querying: select * from game');
  CUBRIDClient.query('select * from game');
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('Data received.');
  Helpers.logInfo('Returned active query handle: ' + queryHandle);
  Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
  Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);

  Helpers.logInfo('Fetching more rows...');
  CUBRIDClient.fetch(queryHandle);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('*** Fetch data received for query: ' + queryHandle);
  Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
  Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());

  // continue to fetch...
  Helpers.logInfo('...');
  Helpers.logInfo('...fetching more rows...');
  Helpers.logInfo('...');
  CUBRIDClient.fetch(queryHandle);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
  Helpers.logInfo('No more data to fetch.');

  Helpers.logInfo('Closing query: ' + queryHandle);
  CUBRIDClient.closeQuery(queryHandle, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function (queryHandle) {
  Helpers.logInfo('Query closed: ' + queryHandle);
  Helpers.logInfo('Closing connection...');

  CUBRIDClient.close();
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});


