exports['test_BasicEvents'] = function (test) {
	var CUBRID = require('../'),
			Helpers = CUBRID.Helpers,
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection();

	Helpers.logInfo('Unit test ' + module.filename.toString() + ' started...');
  test.expect(0);

  client.connect(function () {
    client.close(function () {
    });
  });

  client.on(client.EVENT_ERROR, function () {
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};

