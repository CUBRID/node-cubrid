'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const CAS = require('../src/constants/CASConstants');

describe('CUBRIDConnection', function () {
  describe('query', function () {
    const TABLE_NAME = 'tbl_test';

    function getDate() {
      let d = new Date;
      d.setUTCFullYear(2004, /* 7 is for August */7, 28);

      return d;
    }

    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    function verifyError(client, err) {
      console.log(err);
      console.log('client.brokerInfo.protocolVersion', client.brokerInfo.protocolVersion);

      let error = new Error();
      error.code = -493;

      switch (client.brokerInfo.protocolVersion) {
        case 1:
        case 3:
          error.message = `Syntax: syntax error, unexpected '*' `;
          break;
        default:
          // There is a space at the end.
          error.message = `Syntax: In line 1, column 20 before ') FROM game'\nSyntax error: unexpected '*', expecting SELECT or VALUE or VALUES or '(' `;
          break;
      }

      expect(err).to.be.an.instanceOf(Error);

      // There is a space at the end.
      expect(err.code).to.equal(error.code);
      expect(err.message).to.equal(error.message);
    }

    describe('when using the new protocol', function () {
      it('should succeed to execute query(sql)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .query('SHOW TABLES')
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

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to execute query(sql, callback)', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.query('SHOW TABLES', function (err, result, queryHandle) {
          if (err) {
            return done(err);
          }

          expect(queryHandle)
              .to.be.a('number')
              .to.be.above(0);

          expect(result)
              .to.be.an('object')
              .to.have.property('RowsCount')
              .to.be.a('number')
              .to.equal(10);

          expect(client)
              .to.be.an('object')
              .to.have.property('_queryResultSets')
              .to.be.an('object')
              .to.have.all.keys(['' + queryHandle]);

          client.closeQuery(queryHandle, function (err) {
            if (err) {
              return done(err);
            }

            client.close(done);
          });
        });
      });

      it('should succeed to execute query(sql, callback) multiple times with closeQuery', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queriesCount = 10;
        let promise = Promise.resolve();

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            return client
                .query('SHOW TABLES')
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
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.have.all.keys(['' + response.queryHandle]);

                  return client.closeQuery(response.queryHandle);
                });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should succeed to execute SHOW TABLES query(sql, callback) multiple times', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queriesCount = 10;
        let promise = Promise.resolve();

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            return client.query('SHOW TABLES').then(response => {
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
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.not.empty;
            });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object');

              expect(Object.keys(client._queryResultSets))
                  .to.have.length(queriesCount);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should succeed to execute query(sql, params)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .query('SELECT * FROM nation WHERE continent = ?', ['Asia'])
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
                  .to.equal(47);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to execute query(sql, params, callback)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        const promise = new Promise((resolve, reject) => {
          client.query('SELECT * FROM nation WHERE continent = ?', ['Asia'], function (err, result, queryHandle) {
            if (err) {
              return reject(err);
            }

            resolve({
              queryHandle,
              result,
            });
          });
        });

        return promise
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
                  .to.equal(47);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to execute query(sql, params) multiple times without closeQuery', function (done) {
        this.timeout(100000000);

        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        let queries = [
          {
            sql: "SHOW TABLES",
            params: null,
            rowsCount: 10
          },
          {
            sql: "SELECT * FROM nation",
            params: [],
            rowsCount: 215
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: ['Asia'],
            rowsCount: 47
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: 'Asia',
            rowsCount: 47
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: [2004],
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: 2004,
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: ['2004'],
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: '2004',
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: ['08/28/2004'],
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: '08/28/2004',
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: [getDate()],
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: getDate(),
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: [new Date()],
            rowsCount: 0
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: new Date(),
            rowsCount: 0
          }
        ];
        const queriesCount = queries.length;
        let promise = Promise.resolve();

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            let query = queries.pop();

            return client
                .query(query.sql, query.params)
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
                      .to.equal(query.rowsCount);

                  expect(client)
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.be.not.empty;
                });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object');

              expect(Object.keys(client._queryResultSets))
                  .to.have.length(queriesCount);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should succeed to execute query(sql, params, callback) multiple times without closeQuery', function (done) {
        this.timeout(100000000);

        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        let queries = [
          {
            sql: "SHOW TABLES",
            params: null,
            rowsCount: 10
          },
          {
            sql: "SELECT * FROM nation",
            params: [],
            rowsCount: 215
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: undefined,
            rowsCount: 0
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: null,
            rowsCount: 0
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: ['Asia'],
            rowsCount: 47
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: 'Asia',
            rowsCount: 47
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: [2004],
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: 2004,
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: ['2004'],
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: '2004',
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: ['08/28/2004'],
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: '08/28/2004',
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: [getDate()],
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: getDate(),
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: [new Date()],
            rowsCount: 0
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: new Date(),
            rowsCount: 0
          }
        ];
        const queriesCount = queries.length;
        let promise = Promise.resolve();

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            let query = queries.pop();

            const queryPromise = new Promise((resolve, reject) => {
              client.query(query.sql, query.params, function (err, result, queryHandle) {
                if (err) {
                  return reject(err);
                }

                resolve({
                  queryHandle,
                  result,
                });
              });
            });

            return queryPromise
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
                      .to.equal(query.rowsCount);

                  expect(client)
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.be.not.empty;
                });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object');

              expect(Object.keys(client._queryResultSets))
                  .to.have.length(queriesCount);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should fail to execute query(sql) against a non existing table', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        this.timeout(3000);

        return client.query('SELECT * FROM game_xyz')
            .then(() => {
              throw new Error('Executing query() should have failed.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.code).to.equal(-493);
              expect(err.message).to.equal('Syntax: Unknown class "game_xyz". select * from game_xyz');
            });
      });

      it('should fail to execute query(sql, callback) against a non existing table', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        this.timeout(3000);

        client.query('SELECT * FROM game_xyz', (err) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.code).to.equal(-493);
          expect(err.message).to.equal('Syntax: Unknown class "game_xyz". select * from game_xyz');

          done();
        });
      });

      it('should fail to execute query(sql) when the query has a syntax error', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .query('SELECT wrong_count(*) FROM game')
            .then(() => {
              throw new Error('Should have failed due to a syntax error.')
            })
            .catch(err => {
              verifyError(client, err);
            });
      });

      it('should fail to execute query(sql, callback) when the query has a syntax error', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.query('SELECT wrong_count(*) FROM game', (err) => {
          verifyError(client, err);

          done();
        });
      });

      it('should succeed to query(sql) multiple queries in the same order they were queued', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let query1Response;

        client
            .query('SELECT * FROM event')
            .then(response => {
              query1Response = response;
            });

        expect(query1Response).to.be.undefined;

        return client
            .query('SELECT * FROM record')
            .then(response => {
              // When the second query results are returned, the
              // previous query should already be fullfilled.
              expect(query1Response)
                  .to.be.an('object');

              expect(response)
                  .to.be.an('object');
            });
      });

      it('should succeed to query(sql) the LAST_INSERT_ID()', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        const queries = [
          `CREATE TABLE ${TABLE_NAME}(id INT AUTO_INCREMENT NOT NULL PRIMARY KEY, text VARCHAR(32))`,
          `INSERT INTO ${TABLE_NAME} VALUES(NULL, 'database'), (NULL, 'manager')`,
        ];
        
        return client.batchExecuteNoQuery(queries)
            .then(() => {
              return client.query('SELECT LAST_INSERT_ID()');
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
                  .to.equal(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0])
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0][0])
                  .to.be.a('number')
                  .to.equal(1);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) a constant value', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client.query('SELECT 1')
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
                  .to.equal(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0])
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0][0])
                  .to.be.a('number')
                  .to.equal(1);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) a NULL value', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client.query('SELECT null FROM nation WHERE rownum < 3')
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
                  .to.equal(2);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(2);

              result.ColumnValues.forEach(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(1);

                expect(columns[0])
                    .to.be.null;
              });

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) various data types', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        const lobField = 'qwerty';
        const char = 'a';
        let date = new Date();
        date.setUTCFullYear(2012, /* 0 based; 9 is for October */9, 2);
        date.setUTCHours(18, 25, 45, 100);
        const double = 1.5;
        const float = 2.5;
        const int = 14;
        const money = 3.14;
        const numeric = 16;
        const nChar = '9';
        const nVarChar = '95';
        const varChar = 'varchar';
        const enumString = 'blue';

        let supportsENUM;

        return client
            .connect()
            .then(() => {
              // CUBRID >=9.0 supports `ENUM`.
              supportsENUM = [/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) === -1;

              const createTableQuery =
                  `CREATE TABLE ${TABLE_NAME}(
                    a BIGINT,
                    b BIT(1),
                    c BIT VARYING(1),
                    d BLOB,
                    e CHARACTER(1),
                    f CLOB,
                    g DATE,
                    h DATETIME,
                    i DOUBLE,
                    j FLOAT,
                    k INTEGER,
                    l MONETARY,
                    m NATIONAL CHARACTER(1),
                    o NATIONAL CHARACTER VARYING(100),
                    p NUMERIC(15,0),
                    r CHARACTER VARYING(100),
                    s TIME,
                    t TIMESTAMP,
                    ${supportsENUM ? "z ENUM('red', 'blue', 'yellow') DEFAULT 'red'," : ''}
                    u VARCHAR(4096)
                  )`;

              return client.execute(createTableQuery);
            })
            .then(() => {
              const insertQuery = `INSERT INTO ${TABLE_NAME} VALUES(15, B'0', B'0', ?, ?, ?, ?, ?, ?, ?, ?, ?, N'${nChar}', N'${nVarChar}', ?, ?, ?, ?, ${supportsENUM ? `'${enumString}', ` : ''} ?)`;
              const params = [lobField, char, lobField, date, date, double, float, int, money, numeric, varChar, date, date, varChar];

              return client.execute(insertQuery, params)
            })
            .then(() => {
              return client.query(`SELECT * FROM ${TABLE_NAME}`);
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
                  .to.equal(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              const values = result.ColumnValues[0];

              expect(values)
                  .to.be.an('array')
                  .with.length(supportsENUM ? 20 : 19);

              expect(values[0])
                  .to.be.a('number')
                  .to.equal(15);

              expect(values[1])
                  .to.be.an.instanceOf(Buffer);

              expect(values[1])
                  .to.have.length(1);

              expect(values[1][0])
                  .to.equal(0);

              expect(values[2])
                  .to.be.an.instanceOf(Buffer);

              expect(values[2])
                  .to.have.length(1);

              expect(values[2][0])
                  .to.equal(0);

              expect(values[3])
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number')
                  .to.equal(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);

              expect(values[3])
                  .to.have.property('lobLength')
                  .to.be.a('number')
                  .to.equal(lobField.length);

              const re = new RegExp(`file:.+/demodb/.+/${TABLE_NAME}\.[\\d_]+`);

              expect(values[3])
                  .to.have.property('fileLocator')
                  .to.be.a('string')
                  .to.match(re);

              expect(values[3])
                  .to.have.property('packedLobHandle')
                  .to.be.an.instanceOf(Buffer);

              expect(values[3].packedLobHandle)
                  .to.have.length(values[3].fileLocator.length + /* db_type */4 + /* log size*/ 8 + /* locator size */ 4 + /* null */1);

              expect(values[4])
                  .to.be.a('string')
                  .to.equal(char);

              expect(values[5])
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number')
                  .to.equal(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB);

              expect(values[5])
                  .to.have.property('lobLength')
                  .to.be.a('number')
                  .to.equal(lobField.length);

              expect(values[5])
                  .to.have.property('fileLocator')
                  .to.be.a('string')
                  .to.match(re);

              expect(values[5])
                  .to.have.property('packedLobHandle')
                  .to.be.an.instanceOf(Buffer);

              expect(values[5].packedLobHandle)
                  .to.have.length(values[5].fileLocator.length + /* db_type */4 + /* log size*/ 8 + /* locator size */ 4 + /* null */1);

              expect(values[6])
                  .to.be.an.instanceOf(Date);

              // We cannot directly compare the date values because
              // an instance of `Date` removes time information when
              // storing the data in CUBRID into `DATE` type.
              let dateOnly = new Date(date);
              dateOnly.setUTCHours(0, 0, 0, 0);

              expect(values[6])
                  .to.deep.equal(dateOnly);

              expect(values[7])
                  .to.be.an.instanceOf(Date);

              expect(values[7])
                  .to.deep.equal(date);

              expect(values[8])
                  .to.be.a('number')
                  .to.equal(double);

              expect(values[9])
                  .to.be.a('number')
                  .to.equal(float);

              expect(values[10])
                  .to.be.a('number')
                  .to.equal(int);

              expect(values[11])
                  .to.be.a('number')
                  .to.equal(money);

              expect(values[12])
                  .to.be.a('string')
                  .to.equal(nChar);

              expect(values[13])
                  .to.be.a('string')
                  .to.equal(nVarChar);

              expect(values[14])
                  .to.be.a('number')
                  .to.equal(numeric);

              expect(values[15])
                  .to.be.a('string')
                  .to.equal(varChar);

              expect(values[16])
                  .to.be.an.instanceOf(Date);
              // We cannot directly compare the date values because
              // an instance of `Date` removes date information when
              // storing the data in CUBRID as a `TIME` type.
              let timeOnly = new Date(date);
              timeOnly.setUTCFullYear(1970, 0, 1);
              // `TIME` in CUBRID does not include the millisecond part.
              timeOnly.setMilliseconds(0);

              expect(values[16])
                  .to.deep.equal(timeOnly);

              expect(values[17])
                  .to.be.an.instanceOf(Date);

              // We cannot directly compare the date values because
              // an instance of `Date` removes millisecond information when
              // storing the data in CUBRID as a `TIMESTAMP` type.
              let timestamp = new Date(date);
              timestamp.setMilliseconds(0);

              expect(values[17])
                  .to.deep.equal(timestamp);

              if (supportsENUM) {
                expect(values[18])
                    .to.be.a('string')
                    .to.equal(enumString);

                expect(values[19])
                    .to.be.a('string')
                    .to.equal(varChar);
              } else {
                expect(values[18])
                    .to.be.a('string')
                    .to.equal(varChar);
              }

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should fail to execute query(sql) when the socket connection has been destroyed', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .connect()
            .then(() => {
              client._socket.destroy();
              
              return client.query('SELECT * FROM nation');
            })
            .then(() => {
              throw new Error('Should have failed to query when the socket connection has been destroyed.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              // Node `v6` reports an error that has no `.` at the end of the
              // error message, while previous versions included the `.`.
              expect(err.message).to.contain('This socket is closed');
            });
      });

      it('should succeed to query(sql) the schema users', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client.query('SELECT [name] FROM db_user')
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
                  .to.equal(2);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(2);

              result.ColumnValues.forEach(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(1);

                expect(['PUBLIC', 'DBA'])
                    .to.include(columns[0]);
              });

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });
    });

    describe('when using the old protocol', function () {
      it('should succeed to execute query(sql)', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        expect(client.shouldUseOldQueryProtocol()).to.be.true;

        return client.query('SHOW TABLES')
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

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to execute query(sql, callback)', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        client.query('SHOW TABLES', function (err, result, queryHandle) {
          if (err) {
            return done(err);
          }

          expect(queryHandle)
              .to.be.a('number')
              .to.be.above(0);

          expect(result)
              .to.be.an('object')
              .to.have.property('RowsCount')
              .to.be.a('number')
              .to.equal(10);

          expect(client)
              .to.be.an('object')
              .to.have.property('_queryResultSets')
              .to.be.an('object')
              .to.have.all.keys(['' + queryHandle]);

          client.closeQuery(queryHandle, function (err) {
            if (err) {
              return done(err);
            }

            client.close(done);
          });
        });
      });

      it('should succeed to execute query(sql, callback) multiple times with closeQuery', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queriesCount = 10;
        let promise = Promise.resolve();

        client.setEnforceOldQueryProtocol(true);

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            return client
                .query('SHOW TABLES')
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
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.have.all.keys(['' + response.queryHandle]);

                  return client.closeQuery(response.queryHandle);
                });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should succeed to execute SHOW TABLES query(sql, callback) multiple times', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queriesCount = 10;
        let promise = Promise.resolve();

        client.setEnforceOldQueryProtocol(true);

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            return client.query('SHOW TABLES').then(response => {
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
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.not.empty;
            });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object');

              expect(Object.keys(client._queryResultSets))
                  .to.have.length(queriesCount);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should succeed to execute query(sql, params)', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        client.query('SELECT * FROM nation WHERE continent = ?', ['Asia'])
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
                  .to.equal(47);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            })
            .then(done)
            .catch(done);
      });

      it('should succeed to execute query(sql, callback) multiple times', function (done) {
        this.timeout(100000000);

        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          {
            sql: "SHOW TABLES",
            params: null,
            rowsCount: 10
          },
          {
            sql: "SELECT * FROM nation",
            params: [],
            rowsCount: 215
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: ['Asia'],
            rowsCount: 47
          },
          {
            sql: "SELECT * FROM nation WHERE continent = ?",
            params: 'Asia',
            rowsCount: 47
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: [2004],
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: 2004,
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: ['2004'],
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM history WHERE host_year = ?",
            params: '2004',
            rowsCount: 64
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: ['08/28/2004'],
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: '08/28/2004',
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: [getDate()],
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: getDate(),
            rowsCount: 311
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: [new Date()],
            rowsCount: 0
          },
          {
            sql: "SELECT * FROM game WHERE game_date = ?",
            params: new Date(),
            rowsCount: 0
          }
        ];
        let queriesCount = queries.length;
        let promise = Promise.resolve();

        client.setEnforceOldQueryProtocol(true);

        for (var i = 0; i < queriesCount; ++i) {
          promise = promise.then(() => {
            let query = queries.pop();

            return client.query(query.sql, query.params)
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
                      .to.equal(query.rowsCount);

                  expect(client)
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.be.not.empty;
                });
          });
        }

        promise
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object');

              expect(Object.keys(client._queryResultSets))
                  .to.have.length(queriesCount);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              done();
            })
            .catch(done);
      });

      it('should fail to execute query(sql) against a non existing table', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        this.timeout(3000);

        return client.query('SELECT * FROM game_xyz')
            .then(() => {
              throw new Error('Executing query() should have failed.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.code).to.equal(-493);
              expect(err.message).to.equal('Syntax: Unknown class "game_xyz". select * from game_xyz');
            });
      });

      it('should fail to execute query(sql, callback) against a non existing table', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.query('SELECT * FROM game_xyz', (err) => {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.code).to.equal(-493);
          expect(err.message).to.equal('Syntax: Unknown class "game_xyz". select * from game_xyz');

          done();
        });
      });

      it('should fail to execute query(sql) when the query has a syntax error', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client
            .query('SELECT wrong_count(*) FROM game')
            .then(() => {
              throw new Error('Should have failed due to a syntax error.')
            })
            .catch((err) => {
              verifyError(client, err);
            });
      });

      it('should fail to execute query(sql, callback) when the query has a syntax error', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        client.query('SELECT wrong_count(*) FROM game', (err) => {
          verifyError(client, err);

          done();
        });
      });

      it('should succeed to query(sql) multiple queries in the same order they were queued', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        let query1Response;

        client.setEnforceOldQueryProtocol(true);

        client
            .query('SELECT * FROM event')
            .then(response => {
              query1Response = response;
            });

        expect(query1Response).to.be.undefined;

        return client
            .query('SELECT * FROM record')
            .then(response => {
              // When the second query results are returned, the
              // previous query should already be fullfilled.
              expect(query1Response)
                  .to.be.an('object');

              expect(response)
                  .to.be.an('object');
            });
      });

      it('should succeed to query(sql) the LAST_INSERT_ID()', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();
        const queries = [
          `CREATE TABLE ${TABLE_NAME}(id INT AUTO_INCREMENT NOT NULL PRIMARY KEY, text VARCHAR(32))`,
          `INSERT INTO ${TABLE_NAME} VALUES(NULL, 'database'), (NULL, 'manager')`,
        ];

        client.setEnforceOldQueryProtocol(true);

        return client.batchExecuteNoQuery(queries)
            .then(() => {
              return client.query('SELECT LAST_INSERT_ID()');
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
                  .to.equal(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0])
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0][0])
                  .to.be.a('number')
                  .to.equal(1);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) a constant value', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client.query('SELECT 1')
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
                  .to.equal(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0])
                  .to.be.an('array')
                  .with.length(1);

              expect(result.ColumnValues[0][0])
                  .to.be.a('number')
                  .to.equal(1);

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) a NULL value', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client.query('SELECT null FROM nation WHERE rownum < 3')
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
                  .to.equal(2);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(2);

              result.ColumnValues.forEach(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(1);

                expect(columns[0])
                    .to.be.null;
              });

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) various data types', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        const lobField = 'qwerty';
        const char = 'a';
        let date = new Date();
        date.setUTCFullYear(2012, /* 0 based; 9 is for October */9, 2);
        date.setUTCHours(18, 25, 45, 100);
        const double = 1.5;
        const float = 2.5;
        const int = 14;
        const money = 3.14;
        const numeric = 16;
        const nChar = '9';
        const nVarChar = '95';
        const varChar = 'varchar';
        const enumString = 'blue';

        let supportsENUM;

        return client
            .connect()
            .then(() => {
              // CUBRID >=9.0 supports `ENUM`.
              supportsENUM = [/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) === -1;

              const createTableQuery =
                  `CREATE TABLE ${TABLE_NAME}(
                    a BIGINT,
                    b BIT(1),
                    c BIT VARYING(1),
                    d BLOB,
                    e CHARACTER(1),
                    f CLOB,
                    g DATE,
                    h DATETIME,
                    i DOUBLE,
                    j FLOAT,
                    k INTEGER,
                    l MONETARY,
                    m NATIONAL CHARACTER(1),
                    o NATIONAL CHARACTER VARYING(100),
                    p NUMERIC(15,0),
                    r CHARACTER VARYING(100),
                    s TIME,
                    t TIMESTAMP,
                    ${supportsENUM ? "z ENUM('red', 'blue', 'yellow') DEFAULT 'red'," : ''}
                    u VARCHAR(4096)
                  )`;

              return client.execute(createTableQuery);
            })
            .then(() => {
              const insertQuery = `INSERT INTO ${TABLE_NAME} VALUES(15, B'0', B'0', ?, ?, ?, ?, ?, ?, ?, ?, ?, N'${nChar}', N'${nVarChar}', ?, ?, ?, ?, ${supportsENUM ? `'${enumString}', ` : ''} ?)`;
              const params = [lobField, char, lobField, date, date, double, float, int, money, numeric, varChar, date, date, varChar];

              return client.execute(insertQuery, params)
            })
            .then(() => {
              return client.query(`SELECT * FROM ${TABLE_NAME}`);
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
                  .to.equal(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              const values = result.ColumnValues[0];

              expect(values)
                  .to.be.an('array')
                  .with.length(supportsENUM ? 20 : 19);

              expect(values[0])
                  .to.be.a('number')
                  .to.equal(15);

              expect(values[1])
                  .to.be.an.instanceOf(Buffer);

              expect(values[1])
                  .to.have.length(1);

              expect(values[1][0])
                  .to.equal(0);

              expect(values[2])
                  .to.be.an.instanceOf(Buffer);

              expect(values[2])
                  .to.have.length(1);

              expect(values[2][0])
                  .to.equal(0);

              expect(values[3])
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number')
                  .to.equal(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);

              expect(values[3])
                  .to.have.property('lobLength')
                  .to.be.a('number')
                  .to.equal(lobField.length);

              const re = new RegExp(`file:.+/demodb/.+/${TABLE_NAME}\.[\\d_]+`);

              expect(values[3])
                  .to.have.property('fileLocator')
                  .to.be.a('string')
                  .to.match(re);

              expect(values[3])
                  .to.have.property('packedLobHandle')
                  .to.be.an.instanceOf(Buffer);

              expect(values[3].packedLobHandle)
                  .to.have.length(values[3].fileLocator.length + /* db_type */4 + /* log size*/ 8 + /* locator size */ 4 + /* null */1);

              expect(values[4])
                  .to.be.a('string')
                  .to.equal(char);

              expect(values[5])
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number')
                  .to.equal(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB);

              expect(values[5])
                  .to.have.property('lobLength')
                  .to.be.a('number')
                  .to.equal(lobField.length);

              expect(values[5])
                  .to.have.property('fileLocator')
                  .to.be.a('string')
                  .to.match(re);

              expect(values[5])
                  .to.have.property('packedLobHandle')
                  .to.be.an.instanceOf(Buffer);

              expect(values[5].packedLobHandle)
                  .to.have.length(values[5].fileLocator.length + /* db_type */4 + /* log size*/ 8 + /* locator size */ 4 + /* null */1);

              expect(values[6])
                  .to.be.an.instanceOf(Date);

              // We cannot directly compare the date values because
              // an instance of `Date` removes time information when
              // storing the data in CUBRID into `DATE` type.
              let dateOnly = new Date(date);
              dateOnly.setUTCHours(0, 0, 0, 0);

              expect(values[6])
                  .to.deep.equal(dateOnly);

              expect(values[7])
                  .to.be.an.instanceOf(Date);

              expect(values[7])
                  .to.deep.equal(date);

              expect(values[8])
                  .to.be.a('number')
                  .to.equal(double);

              expect(values[9])
                  .to.be.a('number')
                  .to.equal(float);

              expect(values[10])
                  .to.be.a('number')
                  .to.equal(int);

              expect(values[11])
                  .to.be.a('number')
                  .to.equal(money);

              expect(values[12])
                  .to.be.a('string')
                  .to.equal(nChar);

              expect(values[13])
                  .to.be.a('string')
                  .to.equal(nVarChar);

              expect(values[14])
                  .to.be.a('number')
                  .to.equal(numeric);

              expect(values[15])
                  .to.be.a('string')
                  .to.equal(varChar);

              expect(values[16])
                  .to.be.an.instanceOf(Date);
              // We cannot directly compare the date values because
              // an instance of `Date` removes date information when
              // storing the data in CUBRID as a `TIME` type.
              let timeOnly = new Date(date);
              timeOnly.setUTCFullYear(1970, 0, 1);
              // `TIME` in CUBRID does not include the millisecond part.
              timeOnly.setMilliseconds(0);

              expect(values[16])
                  .to.deep.equal(timeOnly);

              expect(values[17])
                  .to.be.an.instanceOf(Date);

              // We cannot directly compare the date values because
              // an instance of `Date` removes millisecond information when
              // storing the data in CUBRID as a `TIMESTAMP` type.
              let timestamp = new Date(date);
              timestamp.setMilliseconds(0);

              expect(values[17])
                  .to.deep.equal(timestamp);

              if (supportsENUM) {
                expect(values[18])
                    .to.be.a('string')
                    .to.equal(enumString);

                expect(values[19])
                    .to.be.a('string')
                    .to.equal(varChar);
              } else {
                expect(values[18])
                    .to.be.a('string')
                    .to.equal(varChar);
              }

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });

      it('should succeed to query(sql) the schema users', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client.query('SELECT [name] FROM db_user')
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
                  .to.equal(2);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(2);

              result.ColumnValues.forEach(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(1);

                expect(['PUBLIC', 'DBA'])
                    .to.include(columns[0]);
              });

              return client.closeQuery(response.queryHandle);
            })
            .then(() => {
              return client.close();
            });
      });
    });
  });
});
