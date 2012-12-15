var CUBRIDConnection = require('../../src/CUBRIDConnection'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_BasicEvents_Error'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'unknown_user', 'xyz', 'demodb');

  CUBRIDClient.connect(function (err) {
    if (err !== null) {
      CUBRIDClient.close(function () {
      });
    }
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
    Helpers.logInfo('Error: ' + err.message);
    test.ok(err.message === '-165:User "unknown_user" is invalid.' || err.message === 'The connection is already closed!');
    if (err.message === 'The connection is already closed!') {
      Helpers.logInfo('Test passed.');
      test.done();
    }
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
    throw 'We should not get here!';
  });

  CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
    throw 'We should not get here!';
  });
};

