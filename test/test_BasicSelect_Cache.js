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
    Helpers.logInfo('Querying: select * from game');
    var startTime1 = (new Date()).getTime();
    CUBRIDClient.query('select * from game', function (err, result, queryHandle) {
      if (err) {
        errorHandler(err);
      } else {
        var endTime1 = (new Date()).getTime();
        Helpers.logInfo('[First] query execution time (ms): ' + (endTime1 - startTime1).toString());
        assert(Result2Array.TotalRowsCount(result) === 8653);
        CUBRIDClient.closeQuery(queryHandle, function (err) {
          if (err) {
            errorHandler(err)
          } else {
            //Repeat query - results expected to come from cache this time
            var startTime2 = (new Date()).getTime();
            CUBRIDClient.query('select * from game', function (err, result, queryHandle) {
              if (err) {
                errorHandler(err);
              } else {
                var endTime2 = (new Date()).getTime();
                Helpers.logInfo('[Second] query execution time (ms): ' + (endTime2 - startTime2).toString());
                assert(endTime2 - startTime2 <= endTime1 - startTime1);

                assert(Result2Array.TotalRowsCount(result) === 8653);

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
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  }
});


