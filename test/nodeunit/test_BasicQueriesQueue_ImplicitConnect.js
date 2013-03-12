var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var SQL_1 = 'SELECT COUNT(*) FROM [code]';
var SQL_2 = 'SELECT * FROM [code] WHERE s_name = \'X\'';
var SQL_3 = 'SELECT COUNT(*) FROM [code] WHERE f_name LIKE \'M%\'';

function errorHandler(err) {
  throw err.message;
}

exports['test_BasicQueriesQueue_ImplicitConnect'] = function (test) {
  test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');
  Helpers.logInfo('Executing [1]: ' + SQL_1);
  CUBRIDClient.addQuery(SQL_1, function (err, result) {
    if (err) {
      errorHandler(err);
    } else {
      var arr = Result2Array.RowsArray(result);
      Helpers.logInfo('Result [1]: ' + Result2Array.RowsArray(result));
      test.ok(arr[0][0].toString() === '6');
    }
  });

  Helpers.logInfo('Executing [2]: ' + SQL_2);
  CUBRIDClient.addQuery(SQL_2, function (err, result) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Result [2]: ' + Result2Array.RowsArray(result));
      test.ok(Result2Array.RowsArray(result).toString() === 'X,Mixed');
    }
  });

  Helpers.logInfo('Executing [3]: ' + SQL_3);
  CUBRIDClient.addQuery(SQL_3, function (err, result) {
    if (err) {
      errorHandler(err);
    } else {
      var arr = Result2Array.RowsArray(result);
      Helpers.logInfo('Result [3]: ' + Result2Array.RowsArray(result));
      test.ok(arr[0][0].toString() === '2');
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
};
