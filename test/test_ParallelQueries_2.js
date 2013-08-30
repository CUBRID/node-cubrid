exports['test_ParallelQueries_2'] = function (test) {
	var CUBRID = require('../'),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array,
			testSetup = require('./testSetup/test_Setup'),
			// First connection
			client = testSetup.createDefaultCUBRIDDemodbConnection(),
			// Second connection
			client2 = testSetup.createDefaultCUBRIDDemodbConnection();

	test.expect(0);

  Helpers.logInfo(module.filename.toString() + ' started...');

  function A() {
    Helpers.logInfo('Function A called.');
    Helpers.logInfo('Connecting... [A].');
    client.connect(function (err) {
      if (err) {
        throw err;
      } else {
        Helpers.logInfo('Connected [A], on port: ' + client.connectionBrokerPort);
        setTimeout(function () {
	        Helpers.logInfo('setTimeout is triggered. Executing client.query()');

	        client.query('select * from nation', function (err, result, queryHandle) {
		        Helpers.logInfo('Querying [A]: select * from nation');
		        if (err) {
			        throw err;
		        } else {
			        Helpers.logInfo('Query result rows count [A]: ' + Result2Array.TotalRowsCount(result));
			        client.closeQuery(queryHandle, function (err) {
				        if (err) {
					        throw err;
				        } else {
					        Helpers.logInfo('Query closed [A].');
					        client.close(function (err) {
						        if (err) {
							        throw err;
						        } else {
							        Helpers.logInfo('Connection closed [A].');
						        }
					        });
				        }
			        });
		        }
	        });
        }, 3000);
      }
    });
  }

  function B() {
    Helpers.logInfo('Function B called.');
    Helpers.logInfo('Connecting... [B].');
    client2.connect(function (err) {
      if (err) {
        throw err;
      } else {
        Helpers.logInfo('Connected [B], on port: ' + client2.connectionBrokerPort);
        client2.query('select * from game', function (err, result, queryHandle) {
          Helpers.logInfo('Querying [B]: select * from game');
          if (err) {
            throw err;
          } else {
            Helpers.logInfo('Query result rows count [B]: ' + Result2Array.TotalRowsCount(result));
            client2.closeQuery(queryHandle, function (err) {
              if (err) {
                throw err;
              } else {
                Helpers.logInfo('Query closed [B].');
                client2.close(function (err) {
                  if (err) {
                    throw err;
                  } else {
                    Helpers.logInfo('Connection closed [B].');
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  A();
  B();

  setTimeout(function () {
    Helpers.logInfo('Test passed.');
    test.done();
  }, 5000);
};
