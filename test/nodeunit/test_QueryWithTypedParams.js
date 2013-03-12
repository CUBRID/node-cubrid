var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var sql = 'select * from nation where continent = ?';
var arrValues = ['Oceania'];

function errorHandler(err) {
  throw err.message;
}

exports['test_QueryWithTypedParams'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: ' + sql);
      CUBRIDClient.queryWithTypedParams(sql, arrValues, ['varchar'], function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          test.ok(Result2Array.TotalRowsCount(result) === 15);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr[0].toString() === 'KIR,Kiribati,Oceania,Tarawa');
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
              });
            }
          });
        }
      });
    }
  });
};

