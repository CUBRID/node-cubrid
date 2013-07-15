exports['test_NodePool'] = function (test) {
	var CUBRID = require('../'),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array,
			testSetup = require('./testSetup/test_Setup'),
			generic_pool = require('generic-pool');

	test.expect(8);
  Helpers.logInfo(module.filename.toString() + ' started...');

  var pool = generic_pool.Pool({
    name              : 'cubrid-node-pool',
    max               : 2,
    create            : function (callback) {
	    var client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.connect(function (err) {
        if (err == null) {
          Helpers.logInfo('Connection opened.');
        }
        callback(err, client);
      });
    },
    destroy           : function (db) {
      db.close(function (err) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('Connection closed.');
        }
      });
    },
    idleTimeoutMillis : 30000,
    priorityRange     : 3,
    log               : false
  });

  pool.acquire(function (err, client) {
    if (err) {
      Helpers.logError(err);
    }
    else {
      client.query("select * from code", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('[1] Query results:');
          test.ok(Result2Array.TotalRowsCount(result) === 6);
          Helpers.logInfo('[1] Query results rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('[1] Query results:');
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 6);
          client.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('[1] Query closed.');
              // Return object back to pool
              pool.release(client);
            }
          });
        }
      });
    }
  }, 1);

  pool.acquire(function (err, client) {
    if (err) {
      Helpers.logError(err);
    }
    else {
      client.query("select * from code", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('[2] Query results:');
          test.ok(Result2Array.TotalRowsCount(result) === 6);
          Helpers.logInfo('[2] Query results rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('[2] Query results:');
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 6);
          client.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('[2] Query closed.');
              // Return object back to pool
              pool.release(client);
            }
          });
        }
      });
    }
  }, 1);

  pool.acquire(function (err, client) {
    if (err) {
      Helpers.logError(err);
    }
    else {
      client.query("select * from code", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('[3] Query results:');
          test.ok(Result2Array.TotalRowsCount(result) === 6);
          Helpers.logInfo('[3] Query results rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('[3] Query results:');
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 6);
          client.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('[3] Query closed.');
              // Return object back to pool
              pool.release(client);
            }
          });
        }
      });
    }
  }, 2);

  pool.acquire(function (err, client) {
    if (err) {
      Helpers.logError(err);
    }
    else {
      client.query("select * from code", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('[4] Query results:');
          test.ok(Result2Array.TotalRowsCount(result) === 6);
          Helpers.logInfo('[4] Query results rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('[4] Query results:');
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 6);
          client.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('[4] Query closed.');
              // Return object back to pool
              pool.release(client);
            }
          });
        }
      });
    }
  }, 1);

  pool.drain(function () {
    pool.destroyAllNow(function () {
      test.done();
    });
  });
};
