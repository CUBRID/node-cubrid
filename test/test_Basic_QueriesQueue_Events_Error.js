var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var SQL_A = 'SELECT * from x_code';

CUBRIDClient.connect(function () {
});

CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
  Helpers.logError('Error!: ' + err.message);
  assert(err.message === '-493:Syntax: Unknown class "x_code". select * from x_code');
  CUBRIDClient.close();
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
  Helpers.logInfo('Connected.');
  CUBRIDClient.addQuery(SQL_A, null);
});

CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
  Helpers.logInfo('Connection closed.');
  Helpers.logInfo('Test passed.');
  setTimeout(function () {
    process.exit();
  }, 1000);
});
