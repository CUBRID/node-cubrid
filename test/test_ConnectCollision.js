var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function () {
  //close connection after 3 sec.
  setTimeout(function () {
    Helpers.logInfo('Connected.');
    CUBRIDClient.close(function () {
      Helpers.logInfo('Connection closed.');
      Helpers.logInfo('Test passed.');
    });
  }, 3000);
});

//try to connect again
setTimeout(function () {
  CUBRIDClient.connect(function (err) {
    if (err != null) {
      Helpers.logInfo('Error: ' + err.message);
      assert(err.message == 'A connection is already in progress! - denying current connection request.');
    } else {
      CUBRIDClient.close(null);
    }
  });
}, 100);

