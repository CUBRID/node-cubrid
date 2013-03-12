var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var SQL_1 = 'SELECT COUNT(*) FROM [code]';
var SQL_2 = 'SELECT * FROM [code] WHERE s_name = \'X\'';
var SQL_3 = 'SELECT COUNT(*) FROM [code] WHERE f_name LIKE \'M%\'';

exports['test_BasicQueriesQueue'] = function (test) {
  test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');
  CUBRIDClient.connect(function (err) {
    if (err) {
      throw err;
    } else {
      Helpers.logInfo('Connection opened...');

      Helpers.logInfo('Executing: ' + SQL_1);
      CUBRIDClient.addQuery(SQL_1, function (err, result) {
        if (err) {
          throw err;
        } else {
          var arr = Result2Array.RowsArray(result);
          Helpers.logInfo('Result: ' + arr);
          test.ok(arr[0][0].toString() === '6');
        }
      });

      Helpers.logInfo('Executing: ' + SQL_2);
      CUBRIDClient.addQuery(SQL_2, function (err, result) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo('Result: ' + Result2Array.RowsArray(result));
          test.ok(Result2Array.RowsArray(result).toString() === 'X,Mixed');
        }
      });

      Helpers.logInfo('Executing: ' + SQL_3);
      CUBRIDClient.addQuery(SQL_3, function (err, result) {
        if (err) {
          throw err;
        } else {
          var arr = Result2Array.RowsArray(result);
          Helpers.logInfo('Result: ' + Result2Array.RowsArray(result));
          test.ok(arr[0][0].toString() === '2');
          CUBRIDClient.close(function (err) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Test passed.');
              test.done();
            }
          });
        }
      });
    }
  });
};
