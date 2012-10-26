var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers');

exports['test_ConnectCollision'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function () {
    //close connection after 3 sec.
    setTimeout(function (err) {
      if (err) {
        Helpers.logInfo('Error: ' + err.message);
      } else {
        Helpers.logInfo('Connected.');
        CUBRIDClient.close(function (err) {
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

//try to connect again
  setTimeout(function () {
    CUBRIDClient.connect(function (err) {
      if (err) {
        Helpers.logInfo('Error: ' + err.message);
        test.ok(err.message == 'A connection is already in progress! - denying current connection request.');
      } else {
        CUBRIDClient.close(null);
      }
    });
  }, 0);
};
