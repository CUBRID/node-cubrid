var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers;

exports['test_QueryCollision_01'] = function (test) {
  test.expect(15);
  Helpers.logInfo(module.filename.toString() + ' started...');

  test.ok(client.connectionPending === false);
  test.ok(client.connectionOpened === false);
  test.ok(client.queryPending === false);

  client.connect(function () {
    test.ok(client.connectionPending === false);
    test.ok(client.connectionOpened === true);
    test.ok(client.queryPending === false);

    Helpers.logInfo('Executing first query...');
    client.query('select * from nation', function () {
      Helpers.logInfo('First query call completed.');
      test.ok(client.connectionPending === false);
      test.ok(client.connectionOpened === true);
      test.ok(client.queryPending === false);

      Helpers.logInfo('Executing second query...');
      client.query('select * from nation', function () {
      });
    });

    // Close the connection; this will close also the active query status
    setTimeout(function () {
      test.ok(client.connectionPending === false);
      test.ok(client.connectionOpened === true);
      test.ok(client.queryPending === false);

      client.close(function () {
      });
    }, 2000);
  });

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    test.ok(err.message === 'Another query is already in progress! - denying current query request.');
  });

  client.on(client.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    test.ok(client.connectionPending === false);
    test.ok(client.connectionOpened === false);
    test.ok(client.queryPending === false);
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });
};


