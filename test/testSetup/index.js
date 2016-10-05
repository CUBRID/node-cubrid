'use strict';

const path = require('path');
const rootDir = path.resolve(__dirname, '..', '..');
const CUBRID = require(rootDir);
const ConsoleLogger = require(path.join(rootDir, 'src', 'ConsoleLogger'));

const config = {
  hosts: ['localhost'],
  port: 33000,
  user: 'public',
  password: '',
  database: 'demodb',
  maxConnectionRetryCount: 1,
  logger: new ConsoleLogger,
};

exports.config = config;

function createDefaultCUBRIDDemodbConnection() {
  return new CUBRID.createCUBRIDConnection(config);
}

exports.cleanup = function (tableName) {
  return function cleanup() {
    let client = createDefaultCUBRIDDemodbConnection();

    this.timeout(5000);
    
    return client
        .execute(`DROP TABLE IF EXISTS ${tableName}`)
        .then(() => {
          return client.close();
        });
  };
};

exports.createDefaultCUBRIDDemodbConnection = createDefaultCUBRIDDemodbConnection;
