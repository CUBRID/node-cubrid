var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  Helpers.logError(err.message);
  assert(err.message === '-493:Syntax: Unknown class "game_xyz". select * from game_xyz');
}

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Querying: select * from game_xyz');
    CUBRIDClient.query('select * from game_xyz', function (err) {
      if (err) {
        errorHandler(err);
        CUBRIDClient.close();
        Helpers.logInfo('Connection closed.');
        Helpers.logInfo('Test passed.');
      } else {
        throw 'We should never get here!';
      }
    });
  }
});


