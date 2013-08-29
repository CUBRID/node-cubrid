var path = require('path');

exports[path.basename(__filename)] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers;

	test.expect(10);
  Helpers.logInfo(module.filename.toString() + ' started...');

  test.ok(client.connectionPending === false);
  test.ok(client.connectionOpened === false);

  client.connect(function () {
    test.ok(client.connectionPending === false);
    test.ok(client.connectionOpened === true);

    Helpers.logInfo('Executing first query...');
    client.query('select * from nation', function () {
      Helpers.logInfo('First query call completed.');
      test.ok(client.connectionPending === false);
      test.ok(client.connectionOpened === true);

      Helpers.logInfo('Executing second query...');
      client.query('select * from nation', function () {
      });
    });

    // Close the connection; this will close also the active query status
    setTimeout(function () {
      test.ok(client.connectionPending === false);
      test.ok(client.connectionOpened === true);

      client.close(function () {
      });
    }, 2000);
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    test.ok(client.connectionPending === false);
    test.ok(client.connectionOpened === false);
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};


