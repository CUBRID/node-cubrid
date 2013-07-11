var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
  Helpers = require('../../src/utils/Helpers');

exports['test_SocketError'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    Helpers.logInfo(err.message);
    test.ok(err.message === 'This socket is closed.');
    Helpers.logInfo('Test passed.');
    test.done();
  }

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: select * from nation');
      CUBRIDClient._socket.destroy();
      CUBRIDClient.query('select * from nation', function (err) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('We should not get here!');
          CUBRIDClient.close(null);
        }
      });
    }
  });
};
