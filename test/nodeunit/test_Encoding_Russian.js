var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

var testData = 'Я хотел бы отослать этот пакет.'; // Russian: 'I would like to send off this package.'

exports['test_Encoding_Russian'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  ActionQueue.enqueue(
    [
      function (cb) {
        CUBRIDClient.connect(cb);
      },

      function (cb) {
        Helpers.logInfo('Connected...');
        CUBRIDClient.batchExecuteNoQuery(['drop table if exists test_encoding', 'create table test_encoding(str varchar(256))'], cb);
      },

      function (cb) {
        CUBRIDClient.batchExecuteNoQuery('insert into test_encoding values(\'' + testData + '\')', cb);
      },

      function (cb) {
        CUBRIDClient.query('select * from test_encoding where str = \'' + testData + '\'', cb);
      },

      function (result, queryHandle, cb) {
        var arr = Result2Array.RowsArray(result);
        test.ok(arr[0][0] === testData);
        CUBRIDClient.closeQuery(queryHandle, cb);
      },

      function (queryHandle, cb) {
        CUBRIDClient.batchExecuteNoQuery('drop table test_encoding', cb);
      },

      function (cb) {
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
