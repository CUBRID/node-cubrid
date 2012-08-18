var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  throw err.message;
}

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


