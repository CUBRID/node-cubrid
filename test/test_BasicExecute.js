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
      client.execute('drop table if exists node_test', function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.execute('create table node_test(id int)', function (err) {
            if (err) {
              errorHandler(err);
            } else {
              client.execute('insert into node_test values(1)', function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  client.execute('drop table node_test', function (err) {
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
