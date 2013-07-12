var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array,
		SQL_A = 'SELECT * from nation',
		SQL_B = 'SELECT * from code',
		SQL_C = 'SELECT * from game';

exports['test_QueriesQueue_Events'] = function (test) {
  test.expect(6);
  Helpers.logInfo(module.filename.toString() + ' started...');
  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logError('Error!: ' + err.message);
    throw err;
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    client.addQuery(SQL_A, null);
    client.addQuery(SQL_B, null);
    client.addQuery(SQL_C, null);
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle, sql) {
    Helpers.logInfo('Executed! - handle: ' + queryHandle);
    var arr = Result2Array.RowsArray(result);
    Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
    switch (sql) {
      case SQL_A:
        test.ok(arr.length === 215);
        test.ok(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
        break;
      case SQL_B:
        test.ok(Result2Array.TotalRowsCount(result) === 6);
        test.ok(arr[0].toString() === 'X,Mixed');
        break;
      case SQL_C:
        test.ok(arr.length === 235);
        test.ok(arr[0].toString() === '2004,20021,14345,30116,NGR,B,2004-08-28T00:00:00.000Z');
    }
    client.fetch(queryHandle, null);
  });

  client.on(client.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
    Helpers.logInfo('Fetch executed for queryHandle: ' + queryHandle);
    var arr = Result2Array.RowsArray(result);
    Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
    client.closeQuery(queryHandle, null);
  });

  client.on(client.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
    Helpers.logInfo('Fetch executed for queryHandle: ' + queryHandle);
    Helpers.logInfo('There is no more data to fetch.');
    client.closeQuery(queryHandle, null);
  });

  client.on(client.EVENT_QUERY_CLOSED, function (queryHandle) {
    Helpers.logInfo(queryHandle + ' was closed!');
    if (client._queriesQueue.length === 0) {
      setTimeout(function () {
        client.close();
      }, 1000);
    }
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};
