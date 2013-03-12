var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var SQL_DELETE = 'DELETE FROM [code] WHERE s_name = \'A\'';
var SQL_INSERT = 'INSERT INTO [code] VALUES(\'A\', \'ABC\')';
var SQL_COUNT = 'SELECT COUNT(*) from [code]';

exports['test_QueriesQueue_Mixed'] = function (test) {
  test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');
  CUBRIDClient.connect(function (err) {
    if (err) {
      throw err;
    } else {
      Helpers.logInfo('Connection opened...');

      Helpers.logInfo('Queue-ing: ' + SQL_DELETE);
      CUBRIDClient.addNonQuery(SQL_DELETE, function (err) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_DELETE + ' executed.');
        }
      });

      Helpers.logInfo('Queue-ing: ' + SQL_INSERT);
      CUBRIDClient.addNonQuery(SQL_INSERT, function (err) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_INSERT + ' executed.');
        }
      });

      Helpers.logInfo('Queue-ing: ' + SQL_COUNT);
      CUBRIDClient.addQuery(SQL_COUNT, function (err, result) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_COUNT + ' executed.');
          Helpers.logInfo('Table rows count: ' + Result2Array.TotalRowsCount(result));
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 1);
          test.ok(arr[0][0] === 7);
        }
      });

      Helpers.logInfo('Executing: ' + SQL_DELETE);
      CUBRIDClient.addNonQuery(SQL_DELETE, null);
      CUBRIDClient.addQuery(SQL_COUNT, function (err, result) {
        if (err) {
          throw err;
        } else {
          var arr = Result2Array.RowsArray(result);
          test.ok(arr[0][0] === 6);
          CUBRIDClient.close(function () {
            Helpers.logInfo('Connection closed.');
            Helpers.logInfo('Test passed.');
            test.done();
          });
        }
      });
    }
  });
};
