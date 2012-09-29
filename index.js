var CUBRIDConnection = require('./src/CUBRIDConnection');

/**
 * Creates a new connection to the demodb database, using the defaut parameters
 * @type {CUBRIDConnection}
 */
exports.testClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

/**
 * Creates a new connection
 * @param brokerServer
 * @param brokerPort
 * @param user
 * @param password
 * @param database
 * @return {*}
 */
exports.createCUBRIDConnection = function (brokerServer, brokerPort, user, password, database) {
  return new CUBRIDConnection(brokerServer, brokerPort, user, password, database);
};

/**
 * Creates a new connection to the demodb database, with the default parameters
 * @return {*}
 */
exports.createDefaultCUBRIDDemodbConnection = function () {
  return this.createCUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
};

