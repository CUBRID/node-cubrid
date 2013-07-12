var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array;

// TODO: avoid global variables.
global.savedQueryHandle = null;

exports['test_BasicSelect_Events'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logError('Error!: ' + err.message);
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Querying: select * from game');
    client.query('select * from game', function () {
    });
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
    Helpers.logInfo('Data received.');
    Helpers.logInfo('Returned active query handle: ' + queryHandle);
    global.savedQueryHandle = queryHandle; // Save handle - needed for further fetch operations
    Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
    Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);
    Helpers.logInfo('Fetching more rows...');
    client.fetch(global.savedQueryHandle, function () {
    });
  });

  client.on(client.EVENT_FETCH_DATA_AVAILABLE, function (result) {
    Helpers.logInfo('*** Fetch data received.');
    Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
    Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
    // Continue to fetch...
    Helpers.logInfo('...');
    Helpers.logInfo('...fetching more rows...');
    Helpers.logInfo('...');
    setTimeout(function () {
      client.fetch(global.savedQueryHandle, function () {
      });
    }, Math.random() * 500); // Simulate different responses time for each fetch
  });

  client.on(client.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function () {
    Helpers.logInfo('No more data to receive.');
    Helpers.logInfo('Closing query...');
    client.closeQuery(global.savedQueryHandle, function () {
    });
  });

  client.on(client.EVENT_QUERY_CLOSED, function () {
    Helpers.logInfo('Query closed.');
    global.savedQueryHandle = null;
    Helpers.logInfo('Closing connection...');

    client.close(function () {
    });
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};

