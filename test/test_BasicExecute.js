exports['test_BasicExecute'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers;

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(0);

  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      client.execute('DROP TABLE IF EXISTS node_test', function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.execute('CREATE TABLE node_test(id INT)', function (err) {
            if (err) {
              errorHandler(err);
            } else {
              client.execute('INSERT INTO node_test VALUES(1)', function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  client.execute('DROP TABLE node_test', function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
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
