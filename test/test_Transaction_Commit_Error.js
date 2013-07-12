var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
    async = require('async'),
		Helpers = CUBRID.Helpers,
		ActionQueue = CUBRID.ActionQueue,
		Result2Array = CUBRID.Result2Array;

exports['test_Transaction_Commit_Error'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');
  test.expect(2);
  var shards = [0, 1];

  client.connect(function (err) {
    if (err) {
      Helpers.logError(err);
    }
    else {
      Helpers.logInfo('Connected');

      client.setAutoCommitMode(true);
      client.setEnforceOldQueryProtocol(true);

      async.eachSeries(shards, selectAll, function (err) {
        if (err) {
          Helpers.logInfo(err);
        }

        client.close();
      });
    }
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    Helpers.logInfo('Connection closed.');
    Helpers.logInfo('Test passed.');
    client.removeAllListeners();
    test.done();
  });

  function selectAll(shardId, done) {
    var sql = 'SELECT * FROM code';

    Helpers.logInfo(sql);

    client.addQuery(sql, function (err, result, queryHandle) {
      if (err) {
        done(err);
      }
      else {
        Helpers.logInfo('Shard(' + shardId + ') holds ' + Result2Array.TotalRowsCount(result) + ' records');
        client.closeQuery(queryHandle, function (err) {
          client.commit(function (err) {
            if (err) {
              Helpers.logError(err);
              test.ok(err.message === 'AutoCommitMode is enabled! - denying commit request.');
            }
            done();
          });
        });
      }
    });
  };
};
