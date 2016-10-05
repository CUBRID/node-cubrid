exports['test_SchemaAttribute'] = function (test) {
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
      client.getSchema(client.SCHEMA_ATTRIBUTE, null, callback);
    },
    function (result, callback) {
      for (var i = 0; i < 1; i++) {
        Helpers.logInfo(result[i]);
      }

      // CUBRID 8.4.x
      if (client.getEngineVersion().startsWith('8.4')) {
        test.ok(result.length === 191);
      } else {
        // CUBRID 9.0+
        test.ok(result.length === 212);
      }

      test.ok(result[0].Name === 'code');
      test.ok(result[0].Scale === 0);

      // CUBRID 8.4.x
      if (client.getEngineVersion().startsWith('8.4')) {
        test.ok(result[0].Precision === 0);
      } else {
        // CUBRID 9.0+
        test.ok(result[0].Precision === 10);
      }

      test.ok(result[0].NonNull === true);
      test.ok(result[0].Unique === true);
      test.ok(result[0].ClassName === 'athlete');
      test.ok(result[0].SourceClass === 'athlete');
      test.ok(result[0].IsKey === true);
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
