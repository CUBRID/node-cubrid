var CUBRIDConnection = require('../../src/CUBRIDConnection'),
  Helpers = require('../../src/utils/Helpers')

var client = new CUBRIDConnection('localhost', 80, 'public', '', 'demodb');

exports['test_BadPort'] = function (test) {
  test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      test.ok(err.message === 'connect ECONNREFUSED');
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};
