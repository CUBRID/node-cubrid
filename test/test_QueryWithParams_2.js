var CUBRID = require('../'),
    client = require('./testSetup').createDefaultCUBRIDDemodbConnection(),
    Helpers = CUBRID.Helpers,
    Result2Array = CUBRID.Result2Array,
    sql = 'SELECT * FROM ? WHERE ? LIKE ? AND LENGTH(?) > ?',
    arrValues = ['nation', 'code', 'A%', 'capital', '5'];

exports['queryWithParams with defined arrValues and arrDelimiters'] = function (test) {
  var arrDelimiters = ['`', '', '\'', '', ''];

  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: ' + sql);

      client.queryWithParams(sql, arrValues, arrDelimiters, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));

          test.ok(Result2Array.TotalRowsCount(result) === 12);

          client.closeQuery(queryHandle, function (err) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Query closed.');
              client.close(function (err) {
                if (err) {
                  throw err;
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

exports['queryWithParams with defined arrValues but partially defined arrDelimiters (missing delimiters for strings and numbers)'] = function (test) {
  var // Intentionally omitted the last delimiter. node-cubrid should
  // automatically set it as single quotes.
      arrDelimiters = ['`', '', '\'', ''];

  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: ' + sql);

      client.queryWithParams(sql, arrValues, arrDelimiters, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));

          test.ok(Result2Array.TotalRowsCount(result) === 12);

          client.closeQuery(queryHandle, function (err) {
            if (err) {
              throw err;
            } else {
              Helpers.logInfo('Query closed.');
              client.close(function (err) {
                if (err) {
                  throw err;
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
