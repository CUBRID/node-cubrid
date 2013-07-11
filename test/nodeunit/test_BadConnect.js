var CUBRIDConnection = require('../../src/CUBRIDConnection'),
    config = require('./testSetup/test_Setup').config,
  Helpers = require('../../src/utils/Helpers');

exports['test_BadConnect'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');
  test.expect(1);
  var client = new CUBRIDConnection(config.host, config.port, config.user, 'xyz', 'demodb_xyz');

  client.connect(function (err) {
    if (err) {
      test.equal(err.message, '-677:Failed to connect to database server, \'demodb_xyz\', on the following host(s): localhost:localhost');
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};

