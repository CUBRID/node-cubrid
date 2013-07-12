var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array;

exports['test_BasicSelect_ImplicitConnect'] = function (test) {
  test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  Helpers.logInfo('Connected.');
  Helpers.logInfo('Querying: select * from nation');
  client.query('select * from nation', function (err, result, queryHandle) {
    if (err) {
      errorHandler(err);
    } else {
      test.ok(Result2Array.TotalRowsCount(result) === 215);
      Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));

	    var arr = Result2Array.RowsArray(result);

      test.ok(arr.length === 215);
      test.ok(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
      test.ok(arr[arr.length - 1].toString() === 'AFG,Afghanistan,Asia,Kabul');

	    for (var j = 0; j < 1; ++j) {
        Helpers.logInfo(arr[j].toString());
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
};


