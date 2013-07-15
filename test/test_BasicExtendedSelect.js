exports['test_BasicExtendedSelect'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(9);

  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      client.getEngineVersion(function (err, result) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('CUBRID engine version: ' + result);
          Helpers.logInfo('Querying: select * from game');
          client.query('select * from game', function (err, result, queryHandle) {
            if (err) {
              errorHandler(err);
            } else {
              test.equal(Result2Array.TotalRowsCount(result), 8653);
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
              client.fetch(queryHandle, function (err, result) {
                if (err) {
                  errorHandler(err);
                } else {
                  if (result) {
                    Helpers.logInfo('Fetch results:');
                    var arr = Result2Array.RowsArray(result);
                    test.equal(arr.length, 241);
                    test.equal(arr[0].toString().startsWith('2004,20317,14375,30124,GRE,S,2004-08-26T'), true);
                    test.equal(arr[arr.length - 1].toString().startsWith('2004,20060,14340,30125,JPN,B,2004-08-25T'), true);
                    for (var k = 0; k < 1; k++) {
                      Helpers.logInfo(arr[k].toString());
                    }
                  } else {
                    Helpers.logInfo('There is no more data to fetch.');
                  }
                  client.closeQuery(queryHandle, function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      Helpers.logInfo('Query closed.');
                      client.close(function (err) {
                        if (err) {
                          errorHandler(err);
                        } else {
                          Helpers.logInfo('Connection closed.');
                          Helpers.logInfo('Test passed.');
                          test.done();
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
};

