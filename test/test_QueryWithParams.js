var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var sql = 'select * from nation where continent = ?';
var arrValues = ['Oceania'];

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
    CUBRIDClient.queryWithParams(sql, arrValues, ["'"], function (err, result, queryHandle) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
        assert(Result2Array.TotalRowsCount(result) === 15);
        var arr = Result2Array.RowsArray(result);
        assert(arr[0].toString() === 'KIR,Kiribati,Oceania,Tarawa');
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


