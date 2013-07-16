var _CUBRIDConnection = require('./CUBRIDConnection.js');
var _Helpers = require('./utils/Helpers.js');
var _Result2Array = require('./resultset/Result2Array.js');
var _ActionQueue = require('./utils/ActionQueue.js');

/**
 * Helper functions
 * @type {*}
 */
exports.Helpers = _Helpers;
/**
 * Resultset utility functions
 * @type {*}
 */
exports.Result2Array = _Result2Array;
/**
 * ActionQueue utility functions
 * @type {*}
 */
exports.ActionQueue = _ActionQueue;
/**
 * Creates a new connection to the demodb database, using the default parameters
 * @type {CUBRIDConnection}
 */
exports.createDefaultCUBRIDDemodbConnection = function () {
  return new _CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
};

/**
 * Creates a new CUBRID connection. This function creates a new instance of
 * CUBRIDConnection, however doesn't establish actual connection with the
 * broker.
 *
 * @alias createClient, createConnection
 * @param brokerServer
 * @param brokerPort
 * @param user
 * @param password
 * @param database
 * @return {CUBRIDConnection}
 */
exports.createConnection = exports.createCUBRIDConnection = function (brokerServer, brokerPort, user, password, database) {
  return new _CUBRIDConnection(brokerServer, brokerPort, user, password, database);
};
