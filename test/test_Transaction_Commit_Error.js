var CUBRIDConnection = require('../src/CUBRIDConnection'),
  ActionQueue = require('../src/utils/ActionQueue'),
  Result2Array = require('../src/resultset/Result2Array'),
  Helpers = require('../src/utils/Helpers'),
  async = require('async'),
  assert = require('assert'),
  dbConf = {
    host: 'localhost',
    port: 33000,
    user: 'public',
    password: '',
    database: 'demodb'
  },
  client = new CUBRIDConnection(dbConf.host, dbConf.port, dbConf.user, dbConf.password, dbConf.database);

var recordsToPopulate = 1000,
  shards = [0, 1];

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
            assert(err.message === 'AutoCommitMode is enabled! - denying commit request.');
          }
          done();
        });
      });
    }
  });
};
