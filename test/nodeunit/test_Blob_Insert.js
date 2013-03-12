var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_Blob_Insert'] = function (test) {
  test.expect(2*CUBRIDClient._LOB_MAX_IO_LENGTH + 1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (cb) {
        CUBRIDClient.connect(cb);
      },

      function (cb) {
        CUBRIDClient.batchExecuteNoQuery(['drop table if exists test_blob',
                                          'create table test_blob(id int, bl blob)'], cb);
      },

      function (cb) {
        Helpers.logInfo('Create table done.');
        CUBRIDClient.lobNew(CUBRIDClient.LOB_TYPE_BLOB, cb);
      },

      function (lobObject, cb) {
        Helpers.logInfo('LobNew done.');
        Helpers.logInfo('Number of bytes to write: ' + 2 * CUBRIDClient._LOB_MAX_IO_LENGTH);
        var data = new Buffer(2 * CUBRIDClient._LOB_MAX_IO_LENGTH);
        for (var i = 0; i < 2 * CUBRIDClient._LOB_MAX_IO_LENGTH; i++) {
          data[i] = i;
        }
        CUBRIDClient.lobWrite(lobObject, 1, data, cb);
      },

      function (lobObject, written_length, cb) {
        Helpers.logInfo('LobWrite done.');
        CUBRIDClient.executeWithTypedParams('insert into test_blob values(1, ?)', [lobObject], ['blob'], cb);
      },

      function (cb) {
        Helpers.logInfo('Querying: select bl test_blob.');
        CUBRIDClient.query('select bl from test_blob', cb);
      },

      function (result, queryhandle, cb) {
        Helpers.logInfo("Query executed.");
        var arr = Result2Array.RowsArray(result);
        var lobObject = arr[0][0];
        CUBRIDClient.lobRead(lobObject, 1, lobObject.lobLength, cb);
      },

      function (buf, readLength, cb) {
        Helpers.logInfo("LobRead done..");
        Helpers.logInfo('Number of bytes read: ' + readLength);
        test.ok(readLength === 2 * CUBRIDClient._LOB_MAX_IO_LENGTH);
        for (var i = 0; i < buf.length; i++) {
          test.ok(buf[i] === i % 256);
        }
        CUBRIDClient.batchExecuteNoQuery(['DROP TABLE test_blob'], cb);
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
        throw err.message;
      }
    }
  );
};
