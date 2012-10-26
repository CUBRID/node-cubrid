var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.user = 'unknown_user';

CUBRIDClient.connect(null);

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logInfo('Error: ' + err.message);
  assert(err.message == '-165:User "unknown_user" is invalid.');
  Helpers.logInfo('Test passed.');
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  throw 'We should not get here!';
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  throw 'We should not get here!';
});

