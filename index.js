const CUBRIDConnection = require('./src/CUBRIDConnection');
const Helpers = require('./src/utils/Helpers');

/**
 * Helper functions
 * @type {*}
 */
exports.Helpers = Helpers;

/**
 * Creates a new CUBRID connection. This function creates a new instance of
 * CUBRIDConnection, however doesn't establish actual connection with the
 * broker.
 *
 * @alias createClient, createConnection
 * @param hosts
 * @param port
 * @param user
 * @param password
 * @param database
 * @param connectionTimeout
 * @param maxConnectionRetryCount
 * @param logger
 * @return {CUBRIDConnection}
 */
exports.createConnection = exports.createCUBRIDConnection = function (hosts, port, user, password, database, connectionTimeout, maxConnectionRetryCount, logger) {
  return new CUBRIDConnection(hosts, port, user, password, database, connectionTimeout, maxConnectionRetryCount, logger);
};
