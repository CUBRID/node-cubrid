var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  Helpers.logInfo(err.message);
  assert(err.message == 'This socket is closed.');
  Helpers.logInfo('Test passed.');
}

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Querying: select * from nation');
    CUBRIDClient.socket.destroy();
    CUBRIDClient.query('select * from nation', function (err) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('We should not get here!');
      }
    })
  }
});


