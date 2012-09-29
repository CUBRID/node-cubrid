var CUBRIDClient = require('./testSetup/test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array');

function errorHandler(err) {
  throw err.message;
}

exports['test_SelectConstant_02'] = function (test) {
  test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: select null from nation where rownum < 3');
      CUBRIDClient.query('select null from nation where rownum < 3', function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          test.ok(Result2Array.TotalRowsCount(result) === 2);
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('Query results:');
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 2);
          test.ok(arr[0].toString() === '');
          test.ok(arr[1].toString() === '');
          for (var j = 0; j < arr.length; j++) {
            Helpers.logInfo('Value returned: [' + arr[j].toString() + ']');
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
                  test.done();
                }
              })
            }
          })
        }
      })
    }
  });
}

