exports['test_DataTypesEvents'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

// TODO: avoid using global variables.
	global.savedQueryHandle = null;
	global.batchExecuteNo = 0;

	test.expect(21);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(null);

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logError('Error: ' + err.message);
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Batch execute: create table and insert.');
    client.batchExecuteNoQuery(
      [
        'drop table if exists test_data_types',
        'CREATE TABLE test_data_types(' +
          'a bigint,' +
          'b bit(1),' +
          'c bit varying(1),' +
          'd blob,' +
          'e character(1),' +
          'f clob,' +
          'g date,' +
          'h datetime,' +
          'i double,' +
          'j float,' +
          'k integer,' +
          'l monetary,' +
          'm national character(1),' +
          'o national character varying(100),' +
          'p numeric(15,0),' +
          'r character varying(100),' +
          's time,' +
          't timestamp,' +
          'u character varying(4096))',
        'insert into test_data_types values(15, B\'0\',B\'0\', \'qwerty\', \'a\', \'qwerty\', \'2012-10-02\',' +
          '\'2012-10-02 13:25:45\', 1.5, 2.5, 14, 3.14, N\'9\', N\'95\', 16, \'varchar\', \'1899-12-31 13:25:45\',' +
          '\'2012-10-02 13:25:45\', \'varchar\')'
      ],
      null);
  });

  client.on(client.EVENT_BATCH_COMMANDS_COMPLETED, function () {
    if (global.batchExecuteNo === 0) {
      Helpers.logInfo('Batch execute done.');
      Helpers.logInfo('Querying: select * from test_data_types');
      global.batchExecuteNo = 1;
      client.query('select * from test_data_types', null);
    } else {
      Helpers.logInfo('Batch execute done.');
      Helpers.logInfo('Closing query...');
      client.closeQuery(global.savedQueryHandle, null);
    }
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
    Helpers.logInfo('Data received.');
    Helpers.logInfo('Returned active query handle: ' + queryHandle);
    global.savedQueryHandle = queryHandle; // Save handle - needed for further fetch operations
    test.ok(Result2Array.TotalRowsCount(result) === 1);
    Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
    Helpers.logInfo('Returned rows count: ' + Result2Array.RowsArray(result).length);
    var arr = Result2Array.RowsArray(result);
    test.ok(arr.length === 1);
    test.ok(arr[0][0] === 15);
    test.ok(arr[0][1][0] === 0);
    test.ok(arr[0][2][0] === 0);
    test.ok(typeof(arr[0][3]) === 'object');
    test.ok(arr[0][4] === 'a');
    test.ok(typeof(arr[0][5]) === 'object');
    test.ok(arr[0][6].toString().startsWith('2012-10-02') === true);
    test.ok(arr[0][7].toString().startsWith('2012-10-02') === true);
    test.ok(arr[0][8] === 1.5);
    test.ok(arr[0][9] === 2.5);
    test.ok(arr[0][10] === 14);
    test.ok(arr[0][11] === 3.14);
    test.ok(arr[0][12] === '9');
    test.ok(arr[0][13] === '95');
    test.ok(arr[0][14] === 16);
    test.ok(arr[0][15] === 'varchar');
    test.ok(arr[0][16].toString().startsWith('1899-12-31') === true);
    test.ok(arr[0][17].toString().startsWith('2012-10-02') === true);
    test.ok(arr[0][18] === 'varchar');

    client.batchExecuteNoQuery('drop table test_data_types', null);
  });

  client.on(client.EVENT_QUERY_CLOSED, function () {
    Helpers.logInfo('Query closed.');
    global.savedQueryHandle = null;
    Helpers.logInfo('Closing connection...');
    client.close(null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};

