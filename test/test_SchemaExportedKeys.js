exports['test_SchemaExportedKeys'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue;

	test.expect(9);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.getSchema(client.SCHEMA_EXPORTED_KEYS, 'athlete', callback);
    },
    function (result, callback) {
      for (var i = 0; i < 1; i++) {
        Helpers.logInfo(result[i]);
      }
      test.ok(result.length === 1);
      test.ok(result[0].FkName === 'fk_game_athlete_code');
      test.ok(result[0].PkName === 'pk_athlete_code');
      test.ok(result[0].FkTableName === 'game');
      test.ok(result[0].PkTableName === 'athlete');
      test.ok(result[0].FkColumnName === 'athlete_code');
      test.ok(result[0].PkColumnName === 'code');
      test.ok(result[0].UpdateAction === 1);
      test.ok(result[0].DeleteAction === 1);
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
