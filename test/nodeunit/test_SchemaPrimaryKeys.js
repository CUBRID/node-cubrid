var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		ActionQueue = CUBRID.ActionQueue;

exports['test_PrimaryKeys'] = function (test) {
  test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.getSchema(client.SCHEMA_PRIMARY_KEY, 'athlete', callback);
    },
    function (result, callback) {
      for (var i = 0; i < result.length; i++) {
        Helpers.logInfo(result[i]);
      }
      test.ok(result.length === 1);
      test.ok(result[0].TableName === 'athlete');
      test.ok(result[0].ColumnName === 'code');
      test.ok(result[0].KeyName === 'pk_athlete_code');
      client.close(callback);
    }
  ],
  function (err) {
    if (err) {
      throw err.message;
    } else {
      Helpers.logInfo('Test passed.');
      test.done();
    }
  });
};
