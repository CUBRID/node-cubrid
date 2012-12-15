var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../src/utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

ActionQueue.enqueue(
  [
    function (cb) {
      CUBRIDClient.connect(cb);
    },

    function (cb) {
      CUBRIDClient.batchExecuteNoQuery(['drop table if exists test_lob',
                                        'create table test_lob(cl CLOB)',
                                        'insert into test_lob values(CHAR_TO_CLOB(\'Clob test\'))'], cb);
    },

    function (cb) {
      Helpers.logInfo('Batch execute done.');
      CUBRIDClient.query('select * from test_lob', cb);
    },

    function (result, queryHandle, cb) {
      Helpers.logInfo('Query executed.');
      var arr = Result2Array.RowsArray(result);
      var lobObject = arr[0][0];
      CUBRIDClient.lobRead(lobObject, 1, lobObject.lobLength, cb);
    },

    function (str, read_length, cb) {
      Helpers.logInfo('LOB Read done.');
      assert(read_length === 9);
      assert(str === 'Clob test');

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
    } else {
      throw err.message;
    }
  }
);
