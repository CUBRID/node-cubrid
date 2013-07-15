exports['test_QueriesQueue_MultiFetch'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue,
			Result2Array = CUBRID.Result2Array,
			SQL_A = 'SELECT * from event',
			SQL_B = 'SELECT * from game',
			SQL_C = 'SELECT * from participant',
			SQL_A_fetchResult, SQL_B_fetchResult, SQL_C_fetchResult;

	test.expect(6);
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

	        test.ok(Result2Array.TotalRowsCount(result) === 422);
          test.ok(arr[0].toString() === '20421,Wrestling,Greco-Roman 97kg,M,1');

	        ActionQueue.while(
            function () {
              return SQL_A_fetchResult !== null;
            },
            function (callback) {
              client.fetch(queryHandle, function (err, result) {
                if (err) {
                  throw err;
                } else {
                  if (result !== null) {
                    Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
                    var arr = Result2Array.RowsArray(result);
                    Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
                  } else {
                    Helpers.logInfo('There is no more data to fetch.');
                  }
                  SQL_A_fetchResult = result;
                  callback.call(err);
                }
              });
            },
            function (err) {
              if (err) {
                throw err;
              } else {
                client.closeQuery(queryHandle, function (err) {
                  if (err) {
                    throw err;
                  } else {
                    Helpers.logInfo('Query closed.');
                  }
                });
              }
            }
          );
        }
      });

      client.addQuery(SQL_B, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_B + ' executed! - handle: ' + queryHandle);

	        var arr = Result2Array.RowsArray(result);

	        test.ok(arr.length === 235);
          test.ok(arr[0].toString() === '2004,20021,14345,30116,NGR,B,2004-08-28T00:00:00.000Z');

	        ActionQueue.while(
            function () {
              return SQL_B_fetchResult !== null;
            },
            function (callback) {
              client.fetch(queryHandle, function (err, result) {
                if (err) {
                  throw err;
                } else {
                  if (result !== null) {
                    Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
                    var arr = Result2Array.RowsArray(result);
                    Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
                  } else {
                    Helpers.logInfo('There is no more data to fetch.');
                  }
                  SQL_B_fetchResult = result;
                  callback.call(err);
                }
              });
            },
            function (err) {
              if (err) {
                throw err;
              } else {
                client.closeQuery(queryHandle, function (err) {
                  if (err) {
                    throw err;
                  } else {
                    Helpers.logInfo('Query closed.');
                  }
                });
              }
            }
          );
        }
      });

      client.addQuery(SQL_C, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo(SQL_C + ' executed! - handle: ' + queryHandle);
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 309);
          test.ok(arr[0].toString() === '2004,ZAM,0,0,0');
          ActionQueue.while(
            function () {
              return SQL_C_fetchResult !== null;
            },
            function (callback) {
              client.fetch(queryHandle, function (err, result) {
                if (err) {
                  throw err;
                } else {
                  if (result !== null) {
                    Helpers.logInfo('Fetch executed for queryHandle ' + queryHandle);
                    var arr = Result2Array.RowsArray(result);
                    Helpers.logInfo('Fetch results - first row: ' + queryHandle + ': ' + arr[0]);
                  } else {
                    Helpers.logInfo('There is no more data to fetch.');
                  }
                  SQL_C_fetchResult = result;
                  callback.call(err);
                }
              });
            },
            function (err) {
              if (err) {
                throw err;
              } else {
                client.closeQuery(queryHandle, function (err) {
                  if (err) {
                    throw err;
                  } else {
                    Helpers.logInfo('Query closed.');
                  }
                });
              }
            }
          );
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
