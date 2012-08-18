var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  throw err.message;
}

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
        assert(Result2Array.GetResultsCount(result) === 1);
        Helpers.logInfo('Query result rows count: ' + Result2Array.GetResultsCount(result));
        Helpers.logInfo('Query results:');
        var arr = Result2Array.GetResultsArray(result);
        assert(arr.length === 1);
        assert(arr[0].toString() === '1');
        for (var j = 0; j < arr.length; j++) {
          Helpers.logInfo(arr[j].toString());
        }
      }
      CUBRIDClient.closeRequest(queryHandle, function (err) {
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
          })
        }
      })
    })
  }
});


