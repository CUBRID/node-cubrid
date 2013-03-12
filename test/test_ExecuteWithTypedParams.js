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
    CUBRIDClient.batchExecuteNoQuery(
      [
        'drop table if exists test_params',
        'CREATE TABLE test_params(' +
          'a bigint,' +
          'b bit(8),' +
          'c bit varying(8),' +
          'd character(1),' +
          'e date,' +
          'f datetime,' +
          'g double,' +
          'h float,' +
          'i integer,' +
          'j monetary,' +
          'k national character(1),' +
          'l national character varying(100),' +
          'm numeric(15,0),' +
          'n character varying(100),' +
          'o time,' +
          'p timestamp,' +
          'q character varying(4096))'
      ],
      function (err) {
        if (err) {
          errorHandler(err);
        } else {
          var bitValue = new Buffer(1);
          bitValue[0] = 0;
          var varBitValue = new Buffer(1);
          varBitValue[0] = 128;
          var date = new Date();
          date.setUTCFullYear(2012, 10, 2);
          date.setUTCHours(13);
          date.setUTCMinutes(25);
          date.setUTCSeconds(45);
          date.setUTCMilliseconds(0);
          CUBRIDClient.executeWithTypedParams('insert into test_params values( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [15, bitValue, varBitValue, 'a', date, date, 1.5, 2.5, 14, 3.14, '9' , '95', 16, 'varnchar', date, date, 'varchar'],
            ['bigint', 'bit', 'varbit', 'char', 'date', 'datetime', 'double', 'float', 'int', 'monetary',
             'nchar', 'varnchar', 'numeric', 'varchar', 'time', 'timestamp', 'varchar'],
            function (err) {
              if (err) {
                errorHandler(err);
              } else {
                CUBRIDClient.query('select * from test_params', function (err, result, queryHandle) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    assert(Result2Array.TotalRowsCount(result) === 1);
                    Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
                    var arr = Result2Array.RowsArray(result);
                    assert(arr.length === 1);
                    assert(arr[0][0] === 15);
                    assert(arr[0][1][0] === 0);
                    assert(arr[0][2][0] === 128);
                    assert(arr[0][3] === 'a');
                    assert(arr[0][4].toString() === '2012-10-02T00:00:00.000Z');
                    assert(arr[0][5].toString() === '2012-10-02T13:25:45.000Z');
                    assert(arr[0][6] === 1.5);
                    assert(arr[0][7] === 2.5);
                    assert(arr[0][8] === 14);
                    assert(arr[0][9] === 3.14);
                    assert(arr[0][10] === '9');
                    assert(arr[0][11] === '95');
                    assert(arr[0][12] === 16);
                    assert(arr[0][13] === 'varnchar');
                    assert(arr[0][14].toString() === '1899-12-31T13:25:45.000Z');
                    assert(arr[0][15].toString() === '2012-10-02T13:25:45.000Z');
                    assert(arr[0][16] === 'varchar');

                    CUBRIDClient.execute('drop table test_params', function (err) {
                      if (err) {
                        errorHandler(err);
                      } else {
                        CUBRIDClient.close(function (err) {
                          if (err) {
                            errorHandler(err);
                          } else {
                            Helpers.logInfo('Connection closed.');
                            Helpers.logInfo('Test passed.');
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
        }
      });
  }
});


