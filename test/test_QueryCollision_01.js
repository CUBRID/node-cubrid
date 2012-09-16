var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

assert(CUBRIDClient.connectionPending == false);
assert(CUBRIDClient.connectionOpened == false);
assert(CUBRIDClient.queryPending == false);

CUBRIDClient.connect(function () {
  assert(CUBRIDClient.connectionPending == false);
  assert(CUBRIDClient.connectionOpened == true);
  assert(CUBRIDClient.queryPending == false);

  Helpers.logInfo('Executing first query...');
  CUBRIDClient.query('select * from nation', function () {
    Helpers.logInfo('First query call completed.');
    assert(CUBRIDClient.connectionPending == false);
    assert(CUBRIDClient.connectionOpened == true);
    assert(CUBRIDClient.queryPending == true);

    Helpers.logInfo('Executing second query...');
    CUBRIDClient.query('select * from nation', function () {
    });
  });

  // Close the connection; this will close also the active query status
  setTimeout(function () {
    assert(CUBRIDClient.connectionPending == false);
    assert(CUBRIDClient.connectionOpened == true);
    assert(CUBRIDClient.queryPending == true);

    CUBRIDClient.close(function () {
      assert(CUBRIDClient.connectionPending == false);
      assert(CUBRIDClient.connectionOpened == false);
      assert(CUBRIDClient.queryPending == false);
    });
  }, 2000);
});

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logInfo('Error: ' + err.message);
  assert(err.message == 'Another query is already in progress! - denying current query request.');
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});


