var CUBRIDConnection = require('../../src/CUBRIDConnection');

//first connection
var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
//second connection
var CUBRIDClient2 = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

var Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_ParallelQueries_2'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  function A() {
    Helpers.logInfo('Function A called.');
    Helpers.logInfo('Connecting... [A].');
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

  A();
  B();

  setTimeout(function () {
    Helpers.logInfo('Test passed.');
    test.done();
  }, 5000);
};

