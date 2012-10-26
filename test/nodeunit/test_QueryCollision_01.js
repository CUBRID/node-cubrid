var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers');

exports['test_QueryCollision_01'] = function (test) {
  test.expect(15);
  Helpers.logInfo(module.filename.toString() + ' started...');

  test.ok(CUBRIDClient.connectionPending == false);
  test.ok(CUBRIDClient.connectionOpened == false);
  test.ok(CUBRIDClient.queryPending == false);

  CUBRIDClient.connect(function () {
    test.ok(CUBRIDClient.connectionPending == false);
    test.ok(CUBRIDClient.connectionOpened == true);
    test.ok(CUBRIDClient.queryPending == false);

    Helpers.logInfo('Executing first query...');
    CUBRIDClient.query('select * from nation', function () {
      Helpers.logInfo('First query call completed.');
      test.ok(CUBRIDClient.connectionPending == false);
      test.ok(CUBRIDClient.connectionOpened == true);
      test.ok(CUBRIDClient.queryPending == false);

      Helpers.logInfo('Executing second query...');
      CUBRIDClient.query('select * from nation', function () {
      });
    });

    // Close the connection; this will close also the active query status
    setTimeout(function () {
      test.ok(CUBRIDClient.connectionPending == false);
      test.ok(CUBRIDClient.connectionOpened == true);
      test.ok(CUBRIDClient.queryPending == false);

      CUBRIDClient.close(function () {
      });
    }, 2000);
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    test.ok(err.message == 'Another query is already in progress! - denying current query request.');
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connected.');
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    test.ok(CUBRIDClient.connectionPending == false);
    test.ok(CUBRIDClient.connectionOpened == false);
    test.ok(CUBRIDClient.queryPending == false);
    Helpers.logInfo('Test passed.');
    CUBRIDClient.removeAllListeners();
    test.done();
  });
};


