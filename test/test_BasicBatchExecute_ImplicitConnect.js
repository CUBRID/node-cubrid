var CUBRID = require('../'),
		Helpers = CUBRID.Helpers,
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection();

function errorHandler(err) {
  throw err.message;
}

exports['test_BasiBatchExecute_ImplicitConnect'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');
  test.expect(0);

  Helpers.logInfo('Connected.');
  client.batchExecuteNoQuery(['drop table if exists node_test', 'create table node_test(id int)'], function (err) {
    if (err) {
      errorHandler(err);
    } else {
      client.batchExecuteNoQuery(['insert into node_test values(1)'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.batchExecuteNoQuery(['drop table node_test'], function (err) {
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
};

