var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

var errorOcurred = false;

assert(CUBRIDClient.connectionPending == false);
assert(CUBRIDClient.connectionOpened == false);
assert(CUBRIDClient.queryPending == false);

CUBRIDClient.connect(function () {
  assert(CUBRIDClient.connectionPending == false);
  assert(CUBRIDClient.connectionOpened == true);
  assert(CUBRIDClient.queryPending == false);

  Helpers.logInfo('Executing first query...');
  CUBRIDClient.query('select * from event', function () {
  });

  assert(CUBRIDClient.connectionPending == false);
  assert(CUBRIDClient.connectionOpened == true);

  Helpers.logInfo('Executing second query...');
  CUBRIDClient.query('select * from event', function () {
  });
});

// Close the connection; this will close also the active query status
setTimeout(function () {
  assert(CUBRIDClient.connectionPending == false);
  assert(CUBRIDClient.connectionOpened == true);
  assert(CUBRIDClient.queryPending == false);

  CUBRIDClient.close(function () {
    assert(CUBRIDClient.connectionPending == false);
    assert(CUBRIDClient.connectionOpened == false);
    assert(CUBRIDClient.queryPending == false);
  });
}, 3000);

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logInfo('Error: ' + err.message);
  assert(err.message == 'Another query is already in progress! - denying current query request.');
  errorOcurred = true;
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  if (errorOcurred) {
    Helpers.logInfo('Test passed.');
  } else {
    Helpers.logError('Test failed.');
  }
});


