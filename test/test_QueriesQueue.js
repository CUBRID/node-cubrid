exports['test_QueriesQueue'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array,
			SQL_A = 'SELECT * from nation',
			SQL_B = 'SELECT * from code',
			SQL_C = 'SELECT * from game';

	test.expect(8);
  Helpers.logInfo(module.filename.toString() + ' started...');
  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      Helpers.logInfo('Connection opened...');
      client.addQuery(SQL_A, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_A + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 215);
          test.ok(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
          client.fetch(queryHandle, function (err, result, handle) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
              if (result !== null) {
                Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
              } else {
                Helpers.logInfo('There was no data to fetch.');
              }
              client.closeQuery(handle, function (err) {
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

      client.addQuery(SQL_B, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_B + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 6);
          test.ok(arr[0].toString() === 'X,Mixed');
          client.fetch(queryHandle, function (err, result, handle) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
              if (result !== null) {
                Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
              } else {
                Helpers.logInfo('There was no data to fetch.');
              }
              client.closeQuery(handle, function (err) {
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

      client.addQuery(SQL_C, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_C + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 235);
          test.ok(arr[0].toString() === '2004,20021,14345,30116,NGR,B,2004-08-28T00:00:00.000Z');
          client.fetch(queryHandle, function (err, result, handle) {
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
              client.closeQuery(handle, function (err) {
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
        client.close(function (err) {
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
