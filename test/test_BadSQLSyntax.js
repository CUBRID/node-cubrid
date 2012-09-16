var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

function errorHandler(err) {
  Helpers.logError(err.message);
  assert(err.message === '-493:Syntax: Unknown class "game_xyz". select * from game_xyz');
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Querying: select * from game_xyz');
    CUBRIDClient.query('select * from game_xyz', function (err) {
      if (err) {
        errorHandler(err);
        CUBRIDClient.close(function (err) {
          if (err) {
            errorHandler(err);
          }
        });
        Helpers.logInfo('Connection closed.');
        Helpers.logInfo('Test passed.');
      } else {
        throw 'We should never get here!';
      }
    });
  }
});

