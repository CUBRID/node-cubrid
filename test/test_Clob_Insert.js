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
      CUBRIDClient.batchExecuteNoQuery(['drop table if exists test_clob',
                                        'create table test_clob(id int, cl clob)'], cb);
    },

    function (cb) {
      Helpers.logInfo('Create table done.');
      CUBRIDClient.lobNew(CUBRIDClient.LOB_TYPE_CLOB, cb);
    },

    function (lobObject, cb) {
      Helpers.logInfo('LobNew done.');
      var data = 'Test CLOB content.';
      CUBRIDClient.lobWrite(lobObject, 1, data, cb);
    },

    function (lobObject, written_length, cb) {
      Helpers.logInfo('LobWrite done.');
      CUBRIDClient.executeWithTypedParams('insert into test_clob values(1, ?)', [lobObject], ['clob'], cb);
    },

    function (cb) {
      Helpers.logInfo('Querying: select cl test_clob.');
      CUBRIDClient.query('select cl from test_clob', cb);
    },

    function (result, queryhandle, cb) {
      Helpers.logInfo("Query executed.");
      var arr = Result2Array.RowsArray(result);
      var lobObject = arr[0][0];
      CUBRIDClient.lobRead(lobObject, 1, lobObject.lobLength, cb);
    },

    function (string, readLength, cb) {
      Helpers.logInfo("LobRead done..");
      Helpers.logInfo('Number of bytes read: ' + readLength);
      assert(readLength === 'Test CLOB content.'.length);
      assert(string === 'Test CLOB content.');
      CUBRIDClient.batchExecuteNoQuery(['DROP TABLE test_clob'], cb);
    },

    function(cb) {
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
