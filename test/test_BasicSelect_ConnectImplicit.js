var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  throw err.message;
}

Helpers.logInfo('Connected.');
Helpers.logInfo('Querying: select * from nation');
CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
  if (err) {
    errorHandler(err);
  } else {
    assert(Result2Array.GetResultsCount(result) === 215);
    Helpers.logInfo('Query result rows count: ' + Result2Array.GetResultsCount(result));
    var arr = Result2Array.GetResultsArray(result);
    assert(arr.length === 215);
    assert(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
    assert(arr[arr.length - 1].toString() === 'AFG,Afghanistan,Asia,Kabul');
    for (var j = 0; j < arr.length; j++) {
      Helpers.logInfo(arr[j].toString());
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
  }
});



