exports['test_SchemaImportedKeys'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			ActionQueue = CUBRID.ActionQueue;

	test.expect(17);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue([
    function (callback) {
      client.connect(callback);
    },
    function (callback) {
      client.getSchema(client.SCHEMA_IMPORTED_KEYS, 'game', callback);
    },
    function (result, callback) {
      for (var i = 0; i < result.length; ++i) {
        Helpers.logInfo(result[i]);
      }

	    test.ok(result.length === 2);

	    // CUBRID 8.4.x
      if (client._DB_ENGINE_VER.startsWith('8.4')) {
        test.ok(result[0].FkName === 'fk_game_athlete_code');
        test.ok(result[0].PkName === 'pk_athlete_code');
        test.ok(result[0].FkTableName === 'game');
        test.ok(result[0].PkTableName === 'athlete');
        test.ok(result[0].FkColumnName === 'athlete_code');
        test.ok(result[0].PkColumnName === 'code');
        test.ok(result[0].UpdateAction === 1);
        test.ok(result[0].DeleteAction === 1);
        test.ok(result[1].FkName === 'fk_game_event_code');
        test.ok(result[1].PkName === 'pk_event_code');
        test.ok(result[1].FkTableName === 'game');
        test.ok(result[1].PkTableName === 'event');
        test.ok(result[1].FkColumnName === 'event_code');
        test.ok(result[1].PkColumnName === 'code');
        test.ok(result[1].UpdateAction === 1);
        test.ok(result[1].DeleteAction === 1);
      } else {
	      // CUBRID 9.0+
        test.ok(result[0].FkName === 'fk_game_event_code');
        test.ok(result[0].PkName === 'pk_event_code');
        test.ok(result[0].FkTableName === 'game');
        test.ok(result[0].PkTableName === 'event');
        test.ok(result[0].FkColumnName === 'event_code');
        test.ok(result[0].PkColumnName === 'code');
        test.ok(result[0].UpdateAction === 1);
        test.ok(result[0].DeleteAction === 1);
        test.ok(result[1].FkName === 'fk_game_athlete_code');
        test.ok(result[1].PkName === 'pk_athlete_code');
        test.ok(result[1].FkTableName === 'game');
        test.ok(result[1].PkTableName === 'athlete');
        test.ok(result[1].FkColumnName === 'athlete_code');
        test.ok(result[1].PkColumnName === 'code');
        test.ok(result[1].UpdateAction === 1);
        test.ok(result[1].DeleteAction === 1);
      }

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
