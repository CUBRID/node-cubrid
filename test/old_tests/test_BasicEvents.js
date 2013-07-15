var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function () {
  CUBRIDClient.close(function () {
  });
});

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logInfo('Error: ' + err.message);
  throw 'We should not get here!';
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
});

