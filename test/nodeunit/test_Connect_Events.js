var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers');

exports['test_Connect_Events'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect();

  CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
    throw err.message;
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
    Helpers.logInfo('Connection opened.');
    CUBRIDClient.query('select * from game');
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
    CUBRIDClient.closeQuery(queryHandle, function () {
    });
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function () {
    CUBRIDClient.close();
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed');
    Helpers.logInfo('Test passed');
    CUBRIDClient.removeAllListeners();
    test.done();
  });
};

