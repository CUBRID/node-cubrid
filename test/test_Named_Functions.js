var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array;

function errorHandler(err) {
  throw err.message;
}

exports['test_Named_Functions'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(connect_callback);

  function connect_callback(err) {
    if (err) {
      errorHandler(err);
    } else {
      client.query('select * from game', query_callback);
    }
  }

  function query_callback(err, result, queryHandle) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Query results:');
      Helpers.logInfo('Returned active query handle: ' + queryHandle);
      Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
      Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);
      Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
      Helpers.logInfo('Fetching more rows...');
      client.fetch(queryHandle, fetch_callback);
    }
  }

  function fetch_callback(err, result) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Fetch results:');
      Helpers.logInfo('*** Fetch data received.');
      Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
      Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
      client.close(close_callback);
    }
  }

  function close_callback(err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connection closed.');
      Helpers.logInfo('Test passed.');
      test.done();
    }
  }
};
