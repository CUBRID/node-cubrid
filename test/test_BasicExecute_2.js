var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		Result2Array = CUBRID.Result2Array;

function errorHandler(err) {
  throw err.message;
}

exports['test_BasicExecute_2'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      var sqlsArr = [];
      sqlsArr.push('drop table if exists node_test');
      sqlsArr.push('create table node_test(id int)');
      sqlsArr.push('insert into node_test values(2)');
      sqlsArr.push('drop table if exists node_test');
      client.batchExecuteNoQuery(sqlsArr, function (err) {
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
};

