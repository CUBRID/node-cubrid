var CUBRID = require('../../'),
		config = require('./testSetup/test_Setup').config,
		client = CUBRID.createCUBRIDConnection(config.host, config.port, 'unknown_user', 'xyz', config.database),
		Helpers = CUBRID.Helpers;

exports['test_BasicEvents_Error'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (!err) {
      client.close(function () {
      });
    }
  });

  client.on(client.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    test.ok(err.message === '-165:User "unknown_user" is invalid.');
    Helpers.logInfo('Test passed.');
    test.done();
  });

  client.on(client.EVENT_CONNECTED, function () {
    throw 'We should not get here!';
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    throw 'We should not get here!';
  });
};

