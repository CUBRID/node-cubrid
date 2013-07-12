var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers;

exports['test_ConnectCollision'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function () {
    // Close connection after 3 sec.
    setTimeout(function (err) {
      if (err) {
        Helpers.logInfo('Error: ' + err.message);
      } else {
        Helpers.logInfo('Connected.');
        client.close(function (err) {
          if (err) {
            Helpers.logInfo('Error: ' + err.message);
          } else {
            Helpers.logInfo('Connection closed.');
            Helpers.logInfo('Test passed.');
            test.done();
          }
        });
      }
    }, 3000);
  });

  // Try to connect again
  setTimeout(function () {
    client.connect(function (err) {
      if (err) {
        Helpers.logInfo('Error: ' + err.message);
        test.ok(err.message === 'A connection is already in progress! - denying current connection request.');
      } else {
        client.close(null);
      }
    });
  }, 0);
};
