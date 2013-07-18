var path = require('path');

exports[path.basename(__filename)] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue,
			Result2Array = CUBRID.Result2Array;

	test.expect(3);

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
	    // Close the connection without explicitly committing.
	    // It should rollback automatically.
      client.close(cb);
    },
    function (cb) {
      test.ok(client.connectionOpened === false);

	    client.connect(cb);
    },
    function (cb) {
     client.query('SELECT * FROM test_tran', cb);
    },
    function (result, queryHandle, cb) {
      test.ok(Result2Array.TotalRowsCount(result) === 0);
      client.closeQuery(queryHandle, cb);
    },
    function (queryHandle, cb) {
	    // Cleaup after each test.
	    client.execute('drop table test_tran', cb);
    },
	  function (cb) {
		  client.query('select count(*) from db_class where class_name = \'test_tran\'', cb);
	  },
	  function (result, queryHandle, cb) {
		  test.ok(Result2Array.RowsArray(result)[0][0] === 0);

      client.close(cb);
    }
  ], function (err) {
    if (err) {
      throw err.message;
    } else {
      Helpers.logInfo('Connection closed.');
      Helpers.logInfo('Test passed.');
      test.done();
    }
  });
};
