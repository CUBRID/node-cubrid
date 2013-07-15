var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

global.queriesOpened = 0;
global.queriesClosed = 0;

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect();

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  throw err.message;
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');

  setTimeout(function () {
    Helpers.logInfo('[1] Querying: select * from game');
    global.queriesOpened++;
    CUBRIDClient.query('select * from game');
  }, 0);

  setTimeout(function () {
    Helpers.logInfo('[2] Querying: select * from game');
    global.queriesOpened++;
    CUBRIDClient.query('select * from game');
  }, 2000);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('Data received for query handle: ' + queryHandle);
  Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
  Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);

  Helpers.logInfo('Fetching more rows...');
  CUBRIDClient.fetch(queryHandle);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
  Helpers.logInfo('*** Fetch data received for query: ' + queryHandle + '[' + Result2Array.RowsArray(result).length + ' rows]');
  // Continue to fetch...
  Helpers.logInfo('*** fetching more rows...');
  CUBRIDClient.fetch(queryHandle);
});

CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
  Helpers.logInfo('No more data to fetch for query handle: ' + queryHandle);

  Helpers.logInfo('Closing query: ' + queryHandle);
  CUBRIDClient.closeQuery(queryHandle);
});

CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function (queryHandle) {
  Helpers.logInfo('Query closed: ' + queryHandle);
  Helpers.logInfo('Closing connection...');

  global.queriesClosed++;
  if (global.queriesOpened === global.queriesClosed) {
    setTimeout(function () {
      if (CUBRIDClient.connectionOpened) {
        CUBRIDClient.close();
      } else {
        Helpers.logInfo('Connection already closed.');
      }
    }, 5000);
  }
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});


