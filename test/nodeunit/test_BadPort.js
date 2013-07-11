var CUBRIDConnection = require('../../src/CUBRIDConnection'),
    config = require('./testSetup/test_Setup').config,
  Helpers = require('../../src/utils/Helpers')

var client = new CUBRIDConnection(config.host, 80, config.user, config.password, config.database);

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
