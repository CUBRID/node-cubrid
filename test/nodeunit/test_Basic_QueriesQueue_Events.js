var CUBRID = require('../../'),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array,
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		SQL_A = 'SELECT * FROM event',
		SQL_B = 'SELECT * FROM record';

exports['test_Basic_QueriesQueue_Events'] = function (test) {
  test.expect(4);
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
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle, sql) {
    Helpers.logInfo('[' + sql + '] executed - query handle is: ' + queryHandle);
    var arr = Result2Array.RowsArray(result);
    Helpers.logInfo('Query result first row: ' + arr[0]);
    switch (sql) {
      case SQL_A:
        test.ok(Result2Array.TotalRowsCount(result) === 422);
        test.ok(arr[0].toString() === '20421,Wrestling,Greco-Roman 97kg,M,1');
        break;
      case SQL_B:
        test.ok(Result2Array.TotalRowsCount(result) === 2000);
        test.ok(arr[0].toString() === '2000,20243,14214,G,681.1,Score');
    }
    Helpers.logInfo('...let\'s fetch more data...');
    client.fetch(queryHandle);
  });

  client.on(client.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
    Helpers.logInfo('Fetch executed for queryHandle: ' + queryHandle);
    var arr = Result2Array.RowsArray(result);
    Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
    client.closeQuery(queryHandle, null);
  });

  client.on(client.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
    Helpers.logInfo('There is no more data to fetch for query with handle: ' + queryHandle);
    client.closeQuery(queryHandle, null);
  });

  client.on(client.EVENT_QUERY_CLOSED, function (queryHandle) {
    Helpers.logInfo('Query with handle: ' + queryHandle + ' was closed!');
    if (client.queriesQueueIsEmpty()) {
      client.close();
    } else {
      Helpers.logInfo('(...it\'s not the right time to close the connection! - there are some queries still pending execution...)');
    }
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};
