var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  ActionQueue = require('../src/utils/ActionQueue'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
var fetchResult;

CUBRIDClient.connect(function (err) {
  var errHandler = function (err) {
    Helpers.logInfo('Error - ' + err.message);
    throw err.message;
  };

  if (err) {
    errHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    CUBRIDClient.getEngineVersion(function (err, result) {
      if (err) {
        errHandler(err);
      } else {
        Helpers.logInfo('CUBRID engine version: ' + result);
        CUBRIDClient.query('select * from game', function (err, result, queryHandle) {
          if (err) {
            errHandler(err);
          } else {
            assert(Result2Array.GetResultsCount(result) === 235);
            Helpers.logInfo('Query result rows count: ' + Result2Array.GetResultsCount(result));
            assert(Result2Array.GetResultsColumnNamesArray(result).toString() === 'host_year,event_code,athlete_code,stadium_code,nation_code,medal,game_date');
            Helpers.logInfo('Query result column names: ' + Result2Array.GetResultsColumnNamesArray(result));
            assert(Result2Array.GetResultsColumnsTypeArray(result).toString() === 'Int,Int,Int,Int,Char,Char,Date');
            Helpers.logInfo('Query result column data types: ' + Result2Array.GetResultsColumnsTypeArray(result));
            Helpers.logInfo('Query results:');
            var arr = Result2Array.GetResultsArray(result);
            assert(arr.length == 235);
            assert(arr[0].toString().startsWith('2004,20021,14345,30116,NGR,B,2004-09-27T') == true);
            assert(arr[arr.length - 1].toString().startsWith('2004,20317,14457,30124,ITA,G,2004-09-25T') == true);
            for (var j = 0; j < arr.length; j++) {
              Helpers.logInfo(arr[j].toString());
            }

            ActionQueue.while(
              function () {
                return fetchResult !== null;
              },
              function (callback) {
                CUBRIDClient.fetch(queryHandle, function (err, result) {
                  if (err) {
                    errHandler(err);
                  } else {
                    if (result !== null) {
                      Helpers.logInfo('Fetch results:');
                      var arr = Result2Array.GetResultsArray(result);
                      assert(arr.length == 241 || arr.length == 224);
                      for (var k = 0; k < arr.length; k++) {
                        Helpers.logInfo(arr[k].toString());
                      }
                    } else {
                      Helpers.logInfo('There is no more data to fetch.');
                    }
                    fetchResult = result;
                    callback.call(err);
                  }
                })
              },
              function (err) {
                if (err) {
                  errHandler(err);
                } else {
                  CUBRIDClient.closeRequest(queryHandle, function (err) {
                    if (err) {
                      errHandler(err);
                    } else {
                      Helpers.logInfo('Query closed.');
                      CUBRIDClient.close(function (err) {
                        if (err) {
                          errHandler(err);
                        } else {
                          Helpers.logInfo('Connection closed.');
                          Helpers.logInfo('Test passed.');
                        }
                      })
                    }
                  })
                }
              }
            )
          }
        })
      }
    })
  }
});


