var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
//TODO Update this with your own async installation path
  //Async = require('c:/Program Files (x86)/nodejs/node_modules/async/index.js'),
  //Async = require('G:/node_modules/async/lib/async.js'),
  Async = require('async'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var returnedQueryHandle;
var fetchResult;

exports['test_Async'] = function (test) {
  test.expect(41);
  Helpers.logInfo(module.filename.toString() + ' started...');
  Async.waterfall(
    [
      function (cb) {
        CUBRIDClient.connect(cb);
      },

      function (cb) {
        CUBRIDClient.getEngineVersion(cb);
      },

      function (engineVersion, cb) {
        Helpers.logInfo('EngineVersion is: ' + engineVersion);
        CUBRIDClient.query('select * from game', cb);
      },

      function (result, queryHandle, cb) {
        test.equal(Result2Array.RowsArray(result).length, 235);
        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
        test.equal(Result2Array.ColumnNamesArray(result).toString(), 'host_year,event_code,athlete_code,stadium_code,nation_code,medal,game_date');
        Helpers.logInfo('Query result column names: ' + Result2Array.ColumnNamesArray(result));
        test.equal(Result2Array.ColumnTypesArray(result).toString(), 'Int,Int,Int,Int,Char,Char,Date');
        Helpers.logInfo('Query result column data types: ' + Result2Array.ColumnTypesArray(result));
        Helpers.logInfo('Query results:');
        var arr = Result2Array.RowsArray(result);
        test.equal(arr.length, 235);
        test.equal(arr[0].toString().startsWith('2004,20021,14345,30116,NGR,B,2004-08-28T'), true);
        test.equal(arr[arr.length - 1].toString().startsWith('2004,20317,14457,30124,ITA,G,2004-08-26T'), true);
        for (var j = 0; j < 1; j++) {
          Helpers.logInfo(arr[j].toString());
        }
        returnedQueryHandle = queryHandle;
        Async.whilst(
          function () {
            return fetchResult !== null;
          },

          function (callback) {
            CUBRIDClient.fetch(returnedQueryHandle, function (err, result) {
                if (result !== null) {
                  Helpers.logInfo('Fetch results:');
                  var arr = Result2Array.RowsArray(result);
                  test.ok(arr.length === 241 || arr.length === 224);
                  for (var k = 0; k < 1; k++) {
                    Helpers.logInfo(arr[k].toString());
                  }
                } else {
                  Helpers.logInfo('There is no more data to fetch.');
                }
                fetchResult = result;
                callback.call(err);
              }
            );
          },

          function (err) {
            if (err) {
              throw err.message;
            } else {
              cb.call(err);
            }
          }
        );
      },

      function (cb) {
        CUBRIDClient.closeQuery(returnedQueryHandle, cb);
      },

      function (queryHandle, cb) {
        CUBRIDClient.close(cb);
      }
    ],

    function (err) {
      if (err === null) {
        Helpers.logInfo('Test passed.');
        test.done();
      } else {
        throw 'Error executing test!';
      }
    }
  );
};
