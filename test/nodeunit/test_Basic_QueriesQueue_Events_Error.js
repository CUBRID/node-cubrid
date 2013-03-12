var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var SQL_A = 'SELECT * from x_code';

exports['test_Basic_QueriesQueue_Events_Error'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');
  CUBRIDClient.connect(function () {
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
    Helpers.logError('Error!: ' + err.message);
    test.ok(err.message === '-493:Syntax: Unknown class "x_code". select * from x_code');
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
      CUBRIDClient.removeAllListeners();
      test.done();
    }, 1000);
  });
};
