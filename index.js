var CUBRIDConnection = require('./src/CUBRIDConnection');

/**
 * Creates a new CUBRID connection
 * @param brokerServer
 * @param brokerPort
 * @param user
 * @param password
 * @param database
 * @return {*}
 */
exports.createCUBRIDConnection = function(brokerServer, brokerPort, user, password, database) {
  return new CUBRIDConnection(brokerServer, brokerPort, user, password, database);
};

/**
 * Creates a new CUBRID connection to the demodb database, with the default parameters
 * @return {*}
 */
exports.createDefaultCUBRIDDemodbConnection = function() {
  //return new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
  return this.createCUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
};

