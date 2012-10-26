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
    Helpers.logInfo('Connected OK.');
    CUBRIDClient.getEngineVersion(function (err, result) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('CUBRID engine version: ' + result);
        CUBRIDClient.close(function (err) {
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Connection closed.');
            Helpers.logInfo('Test passed.');
          }
        })
      }
    })
  }
});


