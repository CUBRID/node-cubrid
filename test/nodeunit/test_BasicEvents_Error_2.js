var CUBRIDConnection = require('../../src/CUBRIDConnection'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var CUBRIDClient;

exports['test_BasicEvents_Error_2'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'unknown_user', 'xyz', 'demodb');
  CUBRIDClient.connect(null);

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
