var CUBRID = require('../../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers,
		ActionQueue = CUBRID.ActionQueue,
		Result2Array = CUBRID.Result2Array;

exports['test_SchemaConstraint'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.getSchema(client.SCHEMA_CONSTRAINT, 'event', callback);
    },
    function (result, callback) {
      for (var i = 0; i < 1; i++) {
        Helpers.logInfo(result[i]);
      }
      test.ok(result.length === 0);
      client.close(callback);
    }
  ], function (err) {
    if (err) {
      throw err.message;
    } else {
      Helpers.logInfo('Test passed.');
      test.done();
    }
  });
};
