exports['test_SchemaClassPrivilege'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue;

	test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.getSchema(client.SCHEMA_CLASS_PRIVILEGE, null, callback);
    },
    function (result, callback) {
      for (var i = 0; i < 1; i++) {
        Helpers.logInfo(result[i]);
      }

	    // CUBRID 8.4.x
      if (client._DB_ENGINE_VER.startsWith('8.4')) {
        test.ok(result.length === 96);
      } else {
	      // CUBRID 9.0+
        test.ok(result.length === 97);
      }

      test.ok(result[0].TableName === 'db_root');
      test.ok(result[0].Privilege === 'SELECT');
      test.ok(result[0].Grantable === false);
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
