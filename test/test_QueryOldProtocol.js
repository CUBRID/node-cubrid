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
    CUBRIDClient.setEnforceOldQueryProtocol(true);
    Helpers.logInfo('Querying: select * from nation');
    CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
      if (err) {
        errorHandler(err);
      } else {
        assert(Result2Array.TotalRowsCount(result) === 215);
        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
        var arr = Result2Array.RowsArray(result);
        assert(arr.length === 215);
        assert(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
        assert(arr[arr.length - 1].toString() === 'AFG,Afghanistan,Asia,Kabul');
        for (var j = 0; j < 1; j++) {
          Helpers.logInfo(arr[j].toString());
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
      }
    });
  }
});
