exports['test_Schema_Tables'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue;

	test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.getSchema(client.SCHEMA_TABLE, null, callback);
    },
    function (result, callback) {
      for (var i = 0; i < result.length; i++) {
        Helpers.logInfo(result[i]);
      }

      if (client.getEngineVersion().startsWith('8.4')) {
        test.ok(result.length === 32);
      } else {
        test.ok(result.length === 33);
      }

      callback();
    },
    function (callback) {
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
