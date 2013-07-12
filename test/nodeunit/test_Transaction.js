var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
	  ActionQueue = CUBRID.ActionQueue,
	  Result2Array = CUBRID.Result2Array;

exports['test_Transaction'] = function (test) {
  test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (cb) {
      client.connect(cb);
    },
    function (cb) {
      Helpers.logInfo('Connected...');
      client.batchExecuteNoQuery(['drop table if exists test_tran', 'create table test_tran(id int)'], cb);
    },
    function (cb) {
      client.beginTransaction(cb);
    },
    function (cb) {
      client.batchExecuteNoQuery('insert into test_tran values(1)', cb);
    },
    function (cb) {
      client.query('select * from test_tran', cb);
    },
    function (result, queryHandle, cb) {
      test.ok(Result2Array.TotalRowsCount(result) === 1);
      client.closeQuery(queryHandle, cb);
    },
    function (queryHandle, cb) {
      client.rollback(cb);
    },
    function (cb) {
      client.query('select * from test_tran', cb);
    },
    function (result, queryHandle, cb) {
      test.ok(Result2Array.TotalRowsCount(result) === 0);
      client.closeQuery(queryHandle, cb);
    },
    function (queryHandle, cb) {
      client.batchExecuteNoQuery('drop table test_tran', cb);
    },
    function (cb) {
      client.commit(cb);
    },
    function (cb) {
      client.query('select count(*) from db_class where class_name = \'test_tran\'', cb);
    },
    function (result, queryHandle, cb) {
      test.ok(Result2Array.RowsArray(result)[0][0] === 0);
      client.close(cb);
    }
  ], function (err) {
    if (err === null) {
      Helpers.logInfo('Connection closed.');
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw err.message;
    }
  });
};
