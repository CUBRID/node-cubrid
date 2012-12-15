var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

function errorHandler(err) {
  throw err.message;
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    Helpers.logInfo('Querying: select 1');
    CUBRIDClient.query('select 1', function (err, result, queryHandle) {
      if (err) {
        errorHandler(err);
      } else {
        assert(Result2Array.TotalRowsCount(result) === 1);
        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
        Helpers.logInfo('Query results:');
        var arr = Result2Array.RowsArray(result);
        assert(arr.length === 1);
        assert(arr[0].toString() === '1');
        for (var j = 0; j < arr.length; j++) {
          Helpers.logInfo(arr[j].toString());
        }
      }
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
    });
  }
});


