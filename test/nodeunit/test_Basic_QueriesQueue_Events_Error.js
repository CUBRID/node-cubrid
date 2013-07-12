var CUBRID = require('../../'),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array,
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		SQL_A = 'SELECT * from x_code';

exports['test_Basic_QueriesQueue_Events_Error'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

	client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logError('Error!: ' + err.message);
    test.ok(err.message === '-493:Syntax: Unknown class "x_code". select * from x_code');
    client.close();
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
    client.addQuery(SQL_A, null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    setTimeout(function () {
      client.removeAllListeners();
      test.done();
    }, 1000);
  });
};
