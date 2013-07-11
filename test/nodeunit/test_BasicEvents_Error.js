var CUBRIDConnection = require('../../src/CUBRIDConnection'),
    config = require('./testSetup/test_Setup').config,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_BasicEvents_Error'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  var CUBRIDClient = new CUBRIDConnection(config.host, config.port, 'unknown_user', 'xyz', config.database);

  CUBRIDClient.connect(function (err) {
    if (!err) {
      CUBRIDClient.close(function () {
      });
    }
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    test.ok(err.message === '-165:User "unknown_user" is invalid.');
    Helpers.logInfo('Test passed.');
    test.done();
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
    throw 'We should not get here!';
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
    throw 'We should not get here!';
  });
};

