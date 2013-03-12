var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

function errorHandler(err) {
  throw err.message;
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected...');
    CUBRIDClient.setAutoCommitMode(false, function (err) {
      if (err) {
        errorHandler(err);
      } else {
        assert(CUBRIDClient.autoCommitMode === false, 'AutoCommitMode not set correctly!');
        CUBRIDClient.setAutoCommitMode(true, function (err) {
          if (err) {
            errorHandler(err);
          } else {
            assert(CUBRIDClient.autoCommitMode === true, 'AutoCommitMode not set correctly!');
            CUBRIDClient.close(function (err) {
              if (err) {
                errorHandler(err);
              } else {
                Helpers.logInfo('Connection closed...');
                Helpers.logInfo('Test passed.');
              }
            });
          }
        });
      }
    });
  }
});


