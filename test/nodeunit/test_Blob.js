var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_Blob'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (cb) {
        CUBRIDClient.connect(cb);
      },

      function (cb) {
        var data = '';
        for (var i = 0; i < 5120; i++) {
          data += '11111111';
        }
        CUBRIDClient.batchExecuteNoQuery(['drop table if exists test_lob',
          'create table test_lob(bl BLOB)',
          'insert into test_lob values(BIT_TO_BLOB(B\'' + data + '\'))'], cb);
      },

      function (cb) {
        Helpers.logInfo('Create table and insert done.');
        CUBRIDClient.query('select * from test_lob', cb);
      },

      function (result, queryHandle, cb) {
        Helpers.logInfo('Query executed.');
        var arr = Result2Array.RowsArray(result);
        var lobObject = arr[0][0];
        CUBRIDClient.lobRead(lobObject, 1, lobObject.lobLength, cb);
      },

      function (buff, read_length, cb) {
        Helpers.logInfo('LOB Read done.');
        Helpers.logInfo(read_length);
        Helpers.logInfo(buff.length);
        test.ok(read_length === 5120);
        test.ok(buff.length === 5120);
        for (var i = 0; i < read_length; i++) {
          test.ok(buff[i] === 255);
        }
        CUBRIDClient.batchExecuteNoQuery(['DROP TABLE test_lob'], cb);
      },

      function (cb) {
        Helpers.logInfo('Drop table done.');
        CUBRIDClient.close(cb);
      }
    ],

    function (err) {
      if (err === null) {
        Helpers.logInfo('Test passed.');
        test.done();
      } else {
        Helpers.logError(err);
        CUBRIDClient.close(function () {
          test.done();
        });
      }
    }
  );
};
