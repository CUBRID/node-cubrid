exports['test_BatchExecuteVariant'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers;

	test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      client.batchExecuteNoQuery('drop table if exists node_test', function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.batchExecuteNoQuery('create table node_test(id int)', function (err) {
            if (err) {
              errorHandler(err);
            } else {
              client.batchExecuteNoQuery('insert into node_test values(1)', function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  client.batchExecuteNoQuery('drop table node_test', function (err) {
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

