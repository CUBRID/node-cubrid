var CUBRIDConnection = require('../../src/CUBRIDConnection');

var Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_ParallelQueries_3'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  var executed = 0;

  function errorHandler(err) {
    throw err.message;
  }

  function RunQueryInSeparateConnection(i) {
    setTimeout(function () {
      Helpers.logInfo('Opening connecting no. ' + i + '...');
      var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
      CUBRIDClient.connect(function (err) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('Connection no. ' + i + ' was opened on port: ' + CUBRIDClient.connectionBrokerPort);
          CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
            Helpers.logInfo('On connection no. ' + i + ' we are executing query: select * from nation');
            if (err) {
              errorHandler(err);
            } else {
              Helpers.logInfo('On connection no. ' + i + ' we got query result rows count: ' + Result2Array.TotalRowsCount(result));
              CUBRIDClient.closeQuery(queryHandle, function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  Helpers.logInfo('Query closed for connection no. ' + i + '.');
                  CUBRIDClient.close(function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      Helpers.logInfo('Connection no. ' + i + ' was closed.');
                      executed++;
                      Helpers.logInfo('Functions completed: ' + executed + ' out of 10 scheduled.');
                    }
                  });
                }
              });
            }
          });
        }
      });
    }, Math.random() * 1000);
  }

  Helpers.logInfo('Please wait 10 sec. for the test to complete...');
  setTimeout(function () {
    Helpers.logInfo('Test passed.');
    test.done();
  }, 10000);

//Open 10 connections and for each, execute a query
  for (var i = 1; i <= 10; i++) {
    RunQueryInSeparateConnection(i);
  }
};
