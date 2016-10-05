'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const ErrorMessages = require('../src/constants/ErrorMessages');

describe('CUBRIDConnection', function () {
  describe('execute', function () {
    const TABLE_NAME = 'tbl_test';

    before(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    describe('when using the new protocol', function () {
      it('should verify there are no query packets after calling execute(sql)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return client.execute(`DELETE FROM code WHERE s_name = 'ZZZZ'`);
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should verify there are no query packets after calling execute(sql, callback)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return new Promise((resolve, reject) => {
                client.execute(`DELETE FROM code WHERE s_name = 'ZZZZ'`, function (err) {
                  if (err) {
                    return reject(err);
                  }

                  resolve();
                });
              });
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should verify there are no query packets after calling execute(sql) multiple times', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          {
            sql: `CREATE TABLE ${TABLE_NAME}(id INT)`
          },
          {
            sql: `INSERT INTO ${TABLE_NAME} (id) VALUES (1), (2), (3)`
          },
          {
            sql: `DROP TABLE ${TABLE_NAME}`
          }
        ];

        let queriesCount = queries.length;
        let promise = Promise.resolve();

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            let query = queries.shift();

            return client
                .execute(query.sql)
                .then(() => {
                  expect(client)
                      .to.be.an('object')
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.be.empty;
                });
          });
        }

        return promise
            .then(() => {
              return client.query('SHOW TABLES');
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('queryHandle')
                  .to.be.a('number')
                  .to.be.above(0);

              expect(response)
                  .to.have.property('result')
                  .to.be.an('object');

              let result = response.result;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(10);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            });
      });

      it('should verify there are no query packets after calling execute(sql, callback) multiple times', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          {
            sql: `CREATE TABLE ${TABLE_NAME}(id INT)`
          },
          {
            sql: `INSERT INTO ${TABLE_NAME} (id) VALUES (?), (?), (?)`,
            params: [1, 2, 3]
          },
          {
            sql: `DROP TABLE ${TABLE_NAME}`
          }
        ];

        let queriesCount = queries.length;
        let promise = Promise.resolve();

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            let query = queries.shift();

            return new Promise((resolve, reject) => {
              client.execute(query.sql, query.params, function (err) {
                if (err) {
                  return reject(err);
                }

                expect(client)
                    .to.be.an('object')
                    .to.have.property('_queryResultSets')
                    .to.be.an('object')
                    .to.be.empty;

                resolve();
              });
            });
          });
        }

        return promise
            .then(() => {
              return client.query('SHOW TABLES');
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('queryHandle')
                  .to.be.a('number')
                  .to.be.above(0);

              expect(response)
                  .to.have.property('result')
                  .to.be.an('object');

              let result = response.result;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(10);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            });
      });

      it('should succeed to call execute(sql, params)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return client.execute(`DELETE FROM code WHERE s_name = ?`, ['ZZZZ']);
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to call execute(sql, params, callback)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return new Promise((resolve, reject) => {
                client.execute(`DELETE FROM code WHERE s_name = ?`, ['ZZZZ'], function (err) {
                  if (err) {
                    return reject(err);
                  }

                  resolve();
                })
              });
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to call execute(sql, params) with literal params', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return client.execute(`DELETE FROM code WHERE s_name = ?`, 'ZZZZ');
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to call execute(sql, params, callback) with literal params', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return new Promise((resolve, reject) => {
                client.execute(`DELETE FROM code WHERE s_name = ?`, 'ZZZZ', function (err) {
                  if (err) {
                    return reject(err);
                  }

                  resolve();
                })
              });
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to call execute(sqls)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              const queries = [
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
              ];

              return client.execute(queries);
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to call execute(sqls, callback)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              const queries = [
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
              ];

              return new Promise((resolve, reject) => {
                client.execute(queries, function (err) {
                  if (err) {
                    return reject(err);
                  }

                  resolve();
                });
              });
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });
    });

    describe('when using the old protocol', function () {
      it('should verify there are no query packets after calling execute(sql)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client
            // Disable the autocommit mode to make sure the changes
            // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return client.execute(`DELETE FROM code WHERE s_name = 'ZZZZ'`);
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should verify there are no query packets after calling execute(sql) multiple times', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          {
            sql: `CREATE TABLE ${TABLE_NAME}(id INT)`
          },
          {
            sql: `INSERT INTO ${TABLE_NAME} (id) VALUES (1), (2), (3)`
          },
          {
            sql: `DROP TABLE ${TABLE_NAME}`
          }
        ];

        let queriesCount = queries.length;
        let promise = Promise.resolve();

        client.setEnforceOldQueryProtocol(true);

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            let query = queries.shift();

            return client
                .execute(query.sql)
                .then(() => {
                  expect(client)
                      .to.be.an('object')
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.be.empty;
                });
          });
        }

        return promise
            .then(() => {
              return client.query('SHOW TABLES');
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('queryHandle')
                  .to.be.a('number')
                  .to.be.above(0);

              expect(response)
                  .to.have.property('result')
                  .to.be.an('object');

              let result = response.result;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(10);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            });
      });

      it('should succeed to call execute(sql, params)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              return client.execute(`DELETE FROM code WHERE s_name = ?`, ['ZZZZ']);
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to call execute(sqls)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              const queries = [
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
              ];

              return client.execute(queries);
            })
            .then(() => {
              throw new Error('Should have failed to execute multiple queries when using an old protocol.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_MULTIPLE_QUERIES);
            });
      });

      it('should succeed to call execute(sqls, callback)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client
        // Disable the autocommit mode to make sure the changes
        // are not applied.
            .setAutoCommitMode(false)
            .then(() => {
              const queries = [
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
                `DELETE FROM code WHERE s_name = 'ZZZZ'`,
              ];

              return new Promise((resolve, reject) => {
                client.execute(queries, function (err) {
                  if (err) {
                    return reject(err);
                  }

                  resolve();
                });
              });
            })
            .then(() => {
              throw new Error('Should have failed to execute multiple queries when using an old protocol.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_MULTIPLE_QUERIES);
            });
      });
    });
  });
});
