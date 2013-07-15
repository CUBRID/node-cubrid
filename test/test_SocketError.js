exports['test_SocketError'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers;

	test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    Helpers.logInfo(err.message);
    test.ok(err.message === 'This socket is closed.');
    Helpers.logInfo('Test passed.');
    test.done();
  }

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: select * from nation');
      client._socket.destroy();
      client.query('select * from nation', function (err) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('We should not get here!');
          client.close(null);
        }
      });
    }
  });
};
