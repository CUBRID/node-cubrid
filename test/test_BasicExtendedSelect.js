var CUBRIDConnection = require('../src/CUBRIDConnection'),
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

function errorHandler(err) {
  throw err.message;
}

CUBRIDClient.connect(function (err) {
  if (err) {
    errorHandler(err);
  } else {
    Helpers.logInfo('Connected.');
    CUBRIDClient.getEngineVersion(function (err, result) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('CUBRID engine version: ' + result);
        Helpers.logInfo('Querying: select * from game');
        CUBRIDClient.query('select * from game', function (err, result, queryHandle) {
          if (err) {
            errorHandler(err);
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
            CUBRIDClient.fetch(queryHandle, function (err, result) {
              if (err) {
                errorHandler(err);
              } else {
                if (result) {
                  Helpers.logInfo('Fetch results:');
                  var arr = Result2Array.GetResultsArray(result);
                  assert(arr.length == 241);
                  assert(arr[0].toString().startsWith('2004,20317,14375,30124,GRE,S,2004-09-25T') == true);
                  assert(arr[arr.length - 1].toString().startsWith('2004,20060,14340,30125,JPN,B,2004-09-24T') == true);
                  for (var k = 0; k < arr.length; k++) {
                    Helpers.logInfo(arr[k].toString());
                  }
                } else {
                  Helpers.logInfo('There is no more data to fetch.');
                }
                CUBRIDClient.closeRequest(queryHandle, function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    Helpers.logInfo('Query closed.');
                    CUBRIDClient.close(function (err) {
                      if (err) {
                        errorHandler(err);
                      } else {
                        Helpers.logInfo('Connection closed.');
                        Helpers.logInfo('Test passed.');
                      }
                    })
                  }
                })
              }
            })
          }
        });
      }
    });
  }
});


