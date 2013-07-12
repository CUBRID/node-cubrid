var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers;

exports['test_Connect_Events'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    throw err.message;
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connection opened.');
    client.query('select * from game');
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
    client.closeQuery(queryHandle, function () {
    });
  });

  client.on(client.EVENT_QUERY_CLOSED, function () {
    client.close();
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed');
    Helpers.logInfo('Test passed');
    client.removeAllListeners();
    test.done();
  });
};

