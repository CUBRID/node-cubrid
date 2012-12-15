var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var sql = 'SELECT * FROM ? WHERE ? LIKE ? AND LENGTH(?) > ?';
var arrValues = ['nation', 'code', 'A%', 'capital', '5'];
var arrDelimiters = ['`', '', '\'', '', ''];

function errorHandler(err) {
  throw err.message;
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Querying: ' + sql);
    CUBRIDClient.queryWithParams(sql, arrValues, arrDelimiters, function (err, result, queryHandle) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
        assert(Result2Array.TotalRowsCount(result) === 12);
        CUBRIDClient.closeQuery(queryHandle, function (err) {
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Query closed.');
            CUBRIDClient.close(function (err) {
              if (err) {
                errorHandler(err);
              } else {
                Helpers.logInfo('Connection closed.');
                Helpers.logInfo('Test passed.');
              }
            });
          }
        });
      }
    });
  }
});


