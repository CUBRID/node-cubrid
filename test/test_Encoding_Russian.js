exports['test_Encoding_Russian'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue,
			Result2Array = CUBRID.Result2Array,
			testData = 'Я хотел бы отослать этот пакет.'; // Russian: 'I would like to send off this package.'

	test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (cb) {
      client.connect(cb);
    },
    function (cb) {
      Helpers.logInfo('Connected...');
      client.batchExecuteNoQuery(['drop table if exists test_encoding', 'create table test_encoding(str varchar(256))'], cb);
    },
    function (cb) {
      client.batchExecuteNoQuery('insert into test_encoding values(\'' + testData + '\')', cb);
    },
    function (cb) {
      client.query('select * from test_encoding where str = \'' + testData + '\'', cb);
    },
    function (result, queryHandle, cb) {
      var arr = Result2Array.RowsArray(result);
      test.ok(arr[0][0] === testData);
      client.closeQuery(queryHandle, cb);
    },
    function (queryHandle, cb) {
      client.batchExecuteNoQuery('drop table test_encoding', cb);
    },
    function (cb) {
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
