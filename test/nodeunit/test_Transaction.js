var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_Transaction'] = function (test) {
  test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (cb) {
        CUBRIDClient.connect(cb);
      },

      function (cb) {
        Helpers.logInfo('Connected...');
        CUBRIDClient.batchExecuteNoQuery(['drop table if exists test_tran', 'create table test_tran(id int)'], cb);
      },

      function (cb) {
        CUBRIDClient.beginTransaction(cb);
      },

      function (cb) {
        CUBRIDClient.batchExecuteNoQuery('insert into test_tran values(1)', cb);
      },

      function (cb) {
        CUBRIDClient.query('select * from test_tran', cb);
      },

      function (result, queryHandle, cb) {
        test.ok(Result2Array.TotalRowsCount(result) === 1);
        CUBRIDClient.closeQuery(queryHandle, cb);
      },

      function (queryHandle, cb) {
        CUBRIDClient.rollback(cb);
      },

      function (cb) {
        CUBRIDClient.query('select * from test_tran', cb);
      },

      function (result, queryHandle, cb) {
        test.ok(Result2Array.TotalRowsCount(result) === 0);
        CUBRIDClient.closeQuery(queryHandle, cb);
      },

      function (queryHandle, cb) {
        CUBRIDClient.batchExecuteNoQuery('drop table test_tran', cb);
      },

      function (cb) {
        CUBRIDClient.commit(cb);
      },

      function (cb) {
        CUBRIDClient.query('select count(*) from db_class where class_name = \'test_tran\'', cb);
      },

      function (result, queryHandle, cb) {
        test.ok(Result2Array.RowsArray(result)[0][0] === 0);
        CUBRIDClient.close(cb);
      }
    ],

    function (err) {
      if (err === null) {
        Helpers.logInfo('Connection closed.');
        Helpers.logInfo('Test passed.');
        test.done();
      } else {
        throw err.message;
      }
    }
  );
};
