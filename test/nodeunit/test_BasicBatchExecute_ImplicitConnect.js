var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers');

function errorHandler(err) {
  throw err.message;
}

exports['test_BasiBatchExecute_ImplicitConnect'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');
  test.expect(0);

  Helpers.logInfo('Connected.');
  CUBRIDClient.batchExecuteNoQuery(['drop table if exists node_test', 'create table node_test(id int)'], function (err) {
    if (err) {
      errorHandler(err);
    } else {
      CUBRIDClient.batchExecuteNoQuery(['insert into node_test values(1)'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          CUBRIDClient.batchExecuteNoQuery(['drop table node_test'], function (err) {
            if (err) {
              errorHandler(err);
            } else {
              CUBRIDClient.close(function (err) {
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

