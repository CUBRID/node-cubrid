var _CUBRIDConnection = require('./src/CUBRIDConnection.js');
var _Helpers = require('./src/utils/Helpers.js');
var _Result2Array = require('./src/resultset/Result2Array.js');
var _ActionQueue = require('./src/utils/ActionQueue.js');

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
 * Creates a new connection
 * @param brokerServer
 * @param brokerPort
 * @param user
 * @param password
 * @param database
 * @return {*}
 */
exports.createCUBRIDConnection = function (brokerServer, brokerPort, user, password, database) {
  return new _CUBRIDConnection(brokerServer, brokerPort, user, password, database);
};

