var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array,
		sql = 'SELECT * FROM ? WHERE ? LIKE ? AND LENGTH(?) > ?',
		arrValues = ['nation', 'code', 'A%', 'capital', '5'],
		arrDelimiters = ['`', '', '\'', '', ''];

function errorHandler(err) {
  throw err.message;
}

exports['test_QueryWithParams_2'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: ' + sql);
      client.queryWithParams(sql, arrValues, arrDelimiters, function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          test.ok(Result2Array.TotalRowsCount(result) === 12);
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
