var CUBRIDClient = require('./testSetup/test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array');

function errorHandler(err) {
  throw err.message;
}

exports['test_DataTypes'] = function (test) {
  test.expect(21);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Creating the test table...');
      CUBRIDClient.batchExecuteNoQuery(
        [
          'drop table if exists test_data_types',
          'CREATE TABLE test_data_types(' +
            'a bigint,' +
            'b bit(1),' +
            'c bit varying(1),' +
            'd blob,' +
            'e character(1),' +
            'f clob,' +
            'g date,' +
            'h datetime,' +
            'i double,' +
            'j float,' +
            'k integer,' +
            'l monetary,' +
            'm national character(1),' +
            'o national character varying(100),' +
            'p numeric(15,0),' +
            'r character varying(100),' +
            's time,' +
            't timestamp,' +
            'u character varying(4096))',
          'insert into test_data_types values(15, B\'0\',B\'0\', \'qwerty\', \'a\', \'qwerty\', \'2012-10-02\',' +
            '\'2012-10-02 13:25:45\', 1.5, 2.5, 14, 3.14, N\'9\', N\'95\', 16, \'varchar\', \'1899-12-31 13:25:45\',' +
            '\'2012-10-02 13:25:45\', \'varchar\')'
        ],
        function (err) {
          if (err) {
            errorHandler(err);
          } else {
            Helpers.logInfo('Connected.');
            Helpers.logInfo('Querying: select * from test_data_types');
            CUBRIDClient.query('select * from test_data_types', function (err, result, queryHandle) {
              if (err) {
                errorHandler(err);
              } else {
                test.ok(Result2Array.TotalRowsCount(result) === 1);
                Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
                var arr = Result2Array.RowsArray(result);
                test.ok(arr.length === 1);
                test.ok(arr[0][0] === 15);
                test.ok(arr[0][1][0] === 0);
                test.ok(arr[0][2][0] === 0);
                test.ok(arr[0][3] === null);
                test.ok(arr[0][4] === 'a');
                test.ok(arr[0][5] === null);
                test.ok(arr[0][6].toString().startsWith('2012-11-02') === true);
                test.ok(arr[0][7].toString().startsWith('2012-11-02') === true);
                test.ok(arr[0][8] === 1.5);
                test.ok(arr[0][9] === 2.5);
                test.ok(arr[0][10] === 14);
                test.ok(arr[0][11] === 3.14);
                test.ok(arr[0][12] === '9');
                test.ok(arr[0][13] === '95');
                test.ok(arr[0][14] === 16);
                test.ok(arr[0][15] === 'varchar');
                test.ok(arr[0][16].toString().startsWith('1899-12-31') === true);
                test.ok(arr[0][17].toString().startsWith('2012-11-02') === true);
                test.ok(arr[0][18] === 'varchar');

                for (var j = 0; j < arr.length; j++) {
                  Helpers.logInfo(arr[j].toString());
                }
                CUBRIDClient.closeQuery(queryHandle, function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    Helpers.logInfo('Query closed.');
                    CUBRIDClient.batchExecuteNoQuery('drop table test_data_types', function (err) {
                      if (err) {
                        errorHandler(err);
                      } else {
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
            })
          }
        }
      )
    }
  });
}

