var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function () {
});

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logError('Error!: ' + err.message);
  throw 'We should not get here!';
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
  Helpers.logInfo('Querying: select * from game');
  CUBRIDClient.query('select * from game', function () {
  });
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('Data received.');
  Helpers.logInfo('Returned active query handle: ' + queryHandle);
  Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
  Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);
  Helpers.logInfo('Fetching more rows...');
  CUBRIDClient.fetch(queryHandle, function () {
  });
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('*** Fetch data received for query: ' + queryHandle);
  Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
  Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
  // Continue to fetch...
  Helpers.logInfo('...');
  Helpers.logInfo('...fetching more rows...');
  Helpers.logInfo('...');
  setTimeout(function () {
    CUBRIDClient.fetch(queryHandle, function () {
    });
  }, Math.random() * 500); // Simulate different responses time for each fetch
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
  Helpers.logInfo('No more data to fetch.');
  Helpers.logInfo('Closing query: ' + queryHandle);
  CUBRIDClient.closeQuery(queryHandle, function () {
  });
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function (queryHandle) {
  Helpers.logInfo('Query closed: ' + queryHandle);
  Helpers.logInfo('Closing connection...');

  // We had only one query opened - we can now close the connection
  CUBRIDClient.close(function () {
  });
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});


