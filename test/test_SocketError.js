var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

function errorHandler(err) {
  Helpers.logInfo(err.message);
  assert(err.message === 'This socket is closed.');
  Helpers.logInfo('Test passed.');
}

Helpers.logInfo(module.filename.toString() + ' started...');

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
