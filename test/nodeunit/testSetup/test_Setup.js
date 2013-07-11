var CUBRID = require('../../../'),
    config = {
      host: 'localhost',
      port: 33000,
      user: 'public',
      password: '',
      database: 'demodb'
    };

exports.config = config;
exports.createDefaultCUBRIDDemodbConnection = function () {
  return new CUBRID.createCUBRIDConnection(config.host, config.port, config.user, config.password, config.database);
};
