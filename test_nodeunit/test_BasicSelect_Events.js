var CUBRIDClient = require('./testSetup/test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array');

global.savedQueryHandle = null;

exports['test_BasicSelect_Events'] = function (test) {
  test.expect(0);
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
    global.savedQueryHandle = queryHandle; // save handle - needed for further fetch operations
    Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
    Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);
    Helpers.logInfo('Fetching more rows...');
    CUBRIDClient.fetch(global.savedQueryHandle, function () {
    });
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result) {
    Helpers.logInfo('*** Fetch data received.');
    Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
    Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
    // continue to fetch...
    Helpers.logInfo('...');
    Helpers.logInfo('...fetching more rows...');
    Helpers.logInfo('...');
    setTimeout(function () {
      CUBRIDClient.fetch(global.savedQueryHandle, function () {
      });
    }, Math.random() * 500); // simulate different responses time for each fetch
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function () {
    Helpers.logInfo('No more data to receive.');
    Helpers.logInfo('Closing query...');
    CUBRIDClient.closeQuery(global.savedQueryHandle, function () {
    });
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function () {
    Helpers.logInfo('Query closed.');
    global.savedQueryHandle = null;
    Helpers.logInfo('Closing connection...');

    CUBRIDClient.close(function () {
    });
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    CUBRIDClient.removeAllListeners();
    test.done();
  });
}

