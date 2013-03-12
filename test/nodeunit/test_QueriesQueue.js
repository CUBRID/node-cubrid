var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var SQL_A = 'SELECT * from nation';
var SQL_B = 'SELECT * from code';
var SQL_C = 'SELECT * from game';

exports['test_QueriesQueue'] = function (test) {
  test.expect(8);
  Helpers.logInfo(module.filename.toString() + ' started...');
  CUBRIDClient.connect(function (err) {
    if (err) {
      throw err;
    } else {
      Helpers.logInfo('Connection opened...');
      CUBRIDClient.addQuery(SQL_A, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_A + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 215);
          test.ok(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
          CUBRIDClient.fetch(queryHandle, function (err, result, handle) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
              if (result !== null) {
                Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
              } else {
                Helpers.logInfo('There was no data to fetch.');
              }
              CUBRIDClient.closeQuery(handle, function (err) {
                if (err) {
                  throw err;
                } else {
                  Helpers.logInfo(SQL_A + ' closed!');
                }
              });
            }
          });
        }
      });

      CUBRIDClient.addQuery(SQL_B, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_B + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 6);
          test.ok(arr[0].toString() === 'X,Mixed');
          CUBRIDClient.fetch(queryHandle, function (err, result, handle) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
              if (result !== null) {
                Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
              } else {
                Helpers.logInfo('There was no data to fetch.');
              }
              CUBRIDClient.closeQuery(handle, function (err) {
                if (err) {
                  throw err;
                } else {
                  Helpers.logInfo(SQL_B + ' closed!');
                }
              });
            }
          });
        }
      });

      CUBRIDClient.addQuery(SQL_C, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_C + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 235);
          test.ok(arr[0].toString() === '2004,20021,14345,30116,NGR,B,2004-08-28T00:00:00.000Z');
          CUBRIDClient.fetch(queryHandle, function (err, result, handle) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
              if (result !== null) {
                var arr = Result2Array.RowsArray(result);
                Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
                test.ok(arr.length === 241);
                test.ok(arr[0].toString() === '2004,20317,14375,30124,GRE,S,2004-08-26T00:00:00.000Z');
              } else {
                Helpers.logInfo('There was no data to fetch.');
              }
              CUBRIDClient.closeQuery(handle, function (err) {
                if (err) {
                  throw err;
                } else {
                  Helpers.logInfo(SQL_C + ' closed!');
                }
              });
            }
          });
        }
      });

      setTimeout(function () {
        CUBRIDClient.close(function (err) {
          if (err) {
            throw err;
          } else {
            Helpers.logInfo('Connection closed...');
            Helpers.logInfo('Test passed.');
            test.done();
          }
        });
      }, 5000);
    }
  });
};
