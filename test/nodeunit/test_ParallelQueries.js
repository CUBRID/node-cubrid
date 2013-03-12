var CUBRIDConnection = require('../../src/CUBRIDConnection');
var Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_ParallelQueries'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  function fork(async_calls) {
    for (var i = 0; i < async_calls.length; i++) {
      async_calls[i]();
    }

    setTimeout(function () {
      Helpers.logInfo('Test passed.');
      test.done();
    }, 3000);
  }

  function A() {
    Helpers.logInfo('Function A called.');
    Helpers.logInfo('Connecting... [A].');
    var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
    CUBRIDClient.connect(function (err) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('Connected [A], on port: ' + CUBRIDClient.connectionBrokerPort);
        setTimeout(CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
          Helpers.logInfo('Querying [A]: select * from nation');
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Query result rows count [A]: ' + Result2Array.TotalRowsCount(result));
            CUBRIDClient.closeQuery(queryHandle, function (err) {
              if (err) {
                errorHandler(err);
              } else {
                Helpers.logInfo('Query closed [A].');
                CUBRIDClient.close(function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    Helpers.logInfo('Connection closed [A].');
                  }
                });
              }
            });
          }
        }), 3000);
      }
    });
  }

  function B() {
    Helpers.logInfo('Function B called.');
    var CUBRIDClient2 = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
    Helpers.logInfo('Connecting... [B].');
    CUBRIDClient2.connect(function (err) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('Connected [B], on port: ' + CUBRIDClient2.connectionBrokerPort);
        CUBRIDClient2.query('select * from game', function (err, result, queryHandle) {
          Helpers.logInfo('Querying [B]: select * from game');
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Query result rows count [B]: ' + Result2Array.TotalRowsCount(result));
            CUBRIDClient2.closeQuery(queryHandle, function (err) {
              if (err) {
                errorHandler(err);
              } else {
                Helpers.logInfo('Query closed [B].');
                CUBRIDClient2.close(function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    Helpers.logInfo('Connection closed [B].');
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  function C() {
    Helpers.logInfo('Function C called.');
  }

  fork([A, B, C]);
};
