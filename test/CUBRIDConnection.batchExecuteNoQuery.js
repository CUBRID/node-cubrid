'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('batchExecuteNoQuery', function () {
    const TABLE_NAME = 'tbl_test';
    
    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    it('should verify there are no query packets after calling batchExecuteNoQuery(sqls) with multiple queries', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();
      let queries = [
        `CREATE TABLE ${TABLE_NAME}(id INT)`,
        `INSERT INTO ${TABLE_NAME} (id) VALUES (1), (2), (3)`,
        `DROP TABLE ${TABLE_NAME}`
      ];

      return client.batchExecuteNoQuery(queries)
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

    it('should verify there are no query packets after calling batchExecuteNoQuery(sqls, callback) with multiple queries', function (done) {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();
      let queries = [
        `CREATE TABLE ${TABLE_NAME}(id INT)`,
        `INSERT INTO ${TABLE_NAME} (id) VALUES (1), (2), (3)`,
        `DROP TABLE ${TABLE_NAME}`
      ];

      client.batchExecuteNoQuery(queries, function (err) {
        if (err) {
          return done(err);
        }

        client
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

              return client.close();
            })
            .then(done)
            .catch(done);
      });
    });

    it('should succeed to call batchExecuteNoQuery(sqls) with no queries', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();
      let queries = [];

      return client.batchExecuteNoQuery(queries)
          .then(() => {
            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.be.empty;

            return client.close();
          });
    });

    it('should succeed to call batchExecuteNoQuery(sqls, callback) with no queries', function (done) {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();
      let queries = [];

      client.batchExecuteNoQuery(queries, (err) => {
        if (err) {
          return done(err);
        }

        expect(client)
            .to.be.an('object')
            .to.have.property('_queryResultSets')
            .to.be.an('object')
            .to.be.empty;

        client.close(done);
      });
    });

    it('should succeed to call batchExecuteNoQuery() and let another client see the writes', function (done) {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();
      let client2 = testSetup.createDefaultCUBRIDDemodbConnection();
      let queries = [
        `CREATE TABLE ${TABLE_NAME}(id INT)`,
        `INSERT INTO ${TABLE_NAME} (id) VALUES (1), (2), (3)`,
      ];

      client.batchExecuteNoQuery(queries)
          .then(() => {
            return client2.query('SHOW TABLES');
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
                .to.equal(11);

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(11);

            expect(client2)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            // If the table exists, delete it.
            let tables = result.ColumnValues.map(row => row[0]);

            expect(tables).to.contain(TABLE_NAME);

            return client2.query(`SELECT * FROM ${TABLE_NAME}`);
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
                .to.equal(3);

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(3);

            expect(client2)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.contain.keys(['' + response.queryHandle]);

            expect(Object.keys(client2._queryResultSets))
                .to.have.length(2);

            // If the table exists, delete it.
            let ids = result.ColumnValues.map(row => row[0]);

            expect(ids)
                .to.be.an('array')
                .with.length(3);

            expect(ids).to.contain(1);
            expect(ids).to.contain(2);
            expect(ids).to.contain(3);

            return client2.execute(`DROP table ${TABLE_NAME}`);
          })
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

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(10);

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            // If the table exists, delete it.
            let tables = result.ColumnValues.map(row => row[0]);

            expect(tables).to.not.contain(TABLE_NAME);

            return client.close();
          })
          .then(() => {
            return client2.close();
          })
          .then(done)
          .catch(done);
    });

    describe('when SQL is not a string', function () {
      function verifyError(client, err) {
        console.log(err);
        console.log('client.brokerInfo.protocolVersion', client.brokerInfo.protocolVersion);

        let error = new Error();
        error.code = -493;

        switch (client.brokerInfo.protocolVersion) {
          case 1:
            error.message = 'Syntax: syntax error, unexpected UNSIGNED_INTEGER ';
            break;
          case 2:
            error.message = "Syntax: In line 1, column 1 before END OF STATEMENT\nSyntax error: unexpected '1234', expecting SELECT or VALUE or VALUES or '(' ";

            break;
          case 3:
            error.message = 'Syntax: syntax error, unexpected UNSIGNED_INTEGER ';

            expect(err)
                .to.be.an('array')
                .with.length(1);

            err = err[0];
            break;
          default:
            // There is a space at the end.
            error.message = "Syntax: In line 1, column 1 before END OF STATEMENT\nSyntax error: unexpected '1234', expecting SELECT or VALUE or VALUES or '(' ";

            expect(err)
                .to.be.an('array')
                .with.length(1);

            err = err[0];
        }

        expect(err).to.be.an.instanceOf(Error);

        // There is a space at the end.
        expect(err.code).to.equal(error.code);
        expect(err.message).to.equal(error.message);
      }

      it('should fail to call batchExecuteNoQuery(sqls, callback) when SQL is not a string but an array of an integer', function (done) {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [1234];

        client.batchExecuteNoQuery(queries, (err) => {
          verifyError(client, err);

          client.close(done);
        });
      });

      it('should fail to call batchExecuteNoQuery(sqls) when SQL is not a string but an array of an integer', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [1234];

        return client.batchExecuteNoQuery(queries)
            .then(() => {
              throw new Error('Batch execute should have failed.')
            })
            .catch(err => {
              verifyError(client, err);

              return client.close();
            });
      });

      it('should fail to call batchExecuteNoQuery(sqls, callback) when SQL is not a string but an integer', function (done) {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = 1234;

        client.batchExecuteNoQuery(queries, (err) => {
          verifyError(client, err);

          client.close(done);
        });
      });

      it('should fail to call batchExecuteNoQuery(sqls) when SQL is not a string but an integer', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = 1234;

        return client.batchExecuteNoQuery(queries)
            .then(() => {
              throw new Error('Batch execute should have failed.')
            })
            .catch(err => {
              verifyError(client, err);

              return client.close();
            });
      });
    });

    describe('no SQL is specified', function () {
      function verifyError(client, err) {
        console.log(err);
        console.log('client.brokerInfo.protocolVersion', client.brokerInfo.protocolVersion);

        let error = new Error('No statement to execute.');
        error.code = -424;

        switch (client.brokerInfo.protocolVersion) {
          case 1:
          case 2:
            break;
          default:
            expect(err)
                .to.be.an('array')
                .with.length(1);

            err = err[0];
        }

        expect(err).to.be.an.instanceOf(Error);

        // There is a space at the end.
        expect(err.code).to.equal(error.code);
        expect(err.message).to.equal(error.message);
      }

      it('should fail to call batchExecuteNoQuery(sqls, callback) when SQL is not specified', function (done) {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = '';

        client.batchExecuteNoQuery(queries, (err) => {
          verifyError(client, err);

          client.close(done);
        });
      });

      it('should fail to call batchExecuteNoQuery(sqls) when SQL is not specified', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = '';

        return client.batchExecuteNoQuery(queries)
            .then(() => {
              throw new Error('Batch execute should have failed.')
            })
            .catch(err => {
              verifyError(client, err);

              return client.close();
            });
      });
    });

    describe('when one of the batch queries has an invalid syntax', function () {
      function verifyError(client, err) {
        console.log(err);
        console.log('client.brokerInfo.protocolVersion', client.brokerInfo.protocolVersion);

        let error = new Error();
        error.code = -493;

        switch (client.brokerInfo.protocolVersion) {
          case 1:
            error.message = 'Syntax: syntax error, unexpected $end ';
            break;
          case 2:
            error.message = 'Syntax: Syntax error: unexpected END OF STATEMENT ';
            break;
          case 3:
            error.message = 'Syntax: syntax error, unexpected $end ';

            expect(err)
                .to.be.an('array')
                .with.length(1);

            err = err[0];
            break;
          default:
            // There is a space at the end.
            error.message = 'Syntax: Syntax error: unexpected END OF STATEMENT ';

            expect(err)
                .to.be.an('array')
                .with.length(1);

            err = err[0];
        }

        expect(err).to.be.an.instanceOf(Error);

        // There is a space at the end.
        expect(err.code).to.equal(error.code);
        expect(err.message).to.equal(error.message);
      }

      it('should commit only the first SQL while the second SQL is invalid when calling batchExecuteNoQuery()', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          `CREATE TABLE ${TABLE_NAME}(id INT)`,
          `INSERT INTO ${TABLE_NAME} (id)`,
        ];

        return client
            .batchExecuteNoQuery(queries)
            .catch(err => {
              verifyError(client, err);

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
                        .to.equal(11);

                    expect(result)
                        .to.have.property('ColumnValues')
                        .to.be.an('array')
                        .with.length(11);

                    expect(client)
                        .to.be.an('object')
                        .to.have.property('_queryResultSets')
                        .to.be.an('object')
                        .to.have.all.keys(['' + response.queryHandle]);

                    // If the table exists, delete it.
                    let tables = result.ColumnValues.map(row => row[0]);

                    // The first query should be committed.
                    expect(tables).to.contain(TABLE_NAME);

                    // But no records should be inserted due to
                    // an invalid SQL.
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
                        .to.equal(0);

                    expect(result)
                        .to.have.property('ColumnValues')
                        .to.be.an('array')
                        .with.length(0);

                    expect(client)
                        .to.be.an('object')
                        .to.have.property('_queryResultSets')
                        .to.be.an('object')
                        .to.contain.keys(['' + response.queryHandle]);

                    expect(Object.keys(client._queryResultSets))
                        .to.have.length(2);

                    return client.execute(`DROP table ${TABLE_NAME}`);
                  })
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

                    expect(result)
                        .to.have.property('ColumnValues')
                        .to.be.an('array')
                        .with.length(10);

                    expect(client)
                        .to.be.an('object')
                        .to.have.property('_queryResultSets')
                        .to.be.an('object')
                        .to.contain.keys(['' + response.queryHandle]);

                    expect(Object.keys(client._queryResultSets))
                        .to.have.length(3);

                    // If the table exists, delete it.
                    let tables = result.ColumnValues.map(row => row[0]);

                    expect(tables).to.not.contain(TABLE_NAME);

                    return client.close();
                  });
            });
      });

      it('should commit only the first SQL while the second SQL is invalid when calling batchExecuteNoQuery(callback)', function (done) {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          `CREATE TABLE ${TABLE_NAME}(id INT)`,
          `INSERT INTO ${TABLE_NAME} (id)`,
        ];

        client.batchExecuteNoQuery(queries, function (err) {
          verifyError(client, err);

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
                    .to.equal(11);

                expect(result)
                    .to.have.property('ColumnValues')
                    .to.be.an('array')
                    .with.length(11);

                expect(client)
                    .to.be.an('object')
                    .to.have.property('_queryResultSets')
                    .to.be.an('object')
                    .to.have.all.keys(['' + response.queryHandle]);

                // If the table exists, delete it.
                let tables = result.ColumnValues.map(row => row[0]);

                // The first query should be committed.
                expect(tables).to.contain(TABLE_NAME);

                // But no records should be inserted due to
                // an invalid SQL.
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
                    .to.equal(0);

                expect(result)
                    .to.have.property('ColumnValues')
                    .to.be.an('array')
                    .with.length(0);

                expect(client)
                    .to.be.an('object')
                    .to.have.property('_queryResultSets')
                    .to.be.an('object')
                    .to.contain.keys(['' + response.queryHandle]);

                expect(Object.keys(client._queryResultSets))
                    .to.have.length(2);

                return client.execute(`DROP table ${TABLE_NAME}`);
              })
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

                expect(result)
                    .to.have.property('ColumnValues')
                    .to.be.an('array')
                    .with.length(10);

                expect(client)
                    .to.be.an('object')
                    .to.have.property('_queryResultSets')
                    .to.be.an('object')
                    .to.contain.keys(['' + response.queryHandle]);

                expect(Object.keys(client._queryResultSets))
                    .to.have.length(3);

                // If the table exists, delete it.
                let tables = result.ColumnValues.map(row => row[0]);

                expect(tables).to.not.contain(TABLE_NAME);

                return client.close();
              })
              .then(done)
              .catch(done);
        });
      });
    });

    describe('when multiple queries in the batch have an invalid syntax', function () {
      function getColumnTypeError(client, invalidType) {
        let error = new Error();
        error.code = -494;

        switch (client.brokerInfo.protocolVersion) {
          case 1: /* 8.4.1 */
          case 3: /* 8.4.3 */
            error.message = `Semantic: ${invalidType} is not defined. create class ${TABLE_NAME} ( id ${invalidType} ) `;
            break;
          case 2: /* 9.0.0 */
          case 4: /* 9.1.0 */
          default: /* since 9.2.0 */
            error.message = `Semantic: before '  ${invalidType})'\n${invalidType} is not defined. create class ${TABLE_NAME} ( id ${invalidType} ) `;
        }

        return error;
      }

      function verifyError(client, err, queriesCount) {
        console.log(err);
        console.log('client.brokerInfo.protocolVersion', client.brokerInfo.protocolVersion);

        let e = getColumnTypeError(client, 'xyz');

        switch (client.brokerInfo.protocolVersion) {
          case 1: /* 8.4.1 */
            expect(err).to.be.an.instanceOf(Error);
            expect(err.code).to.equal(e.code);
            expect(err.message).to.equal(e.message);
            break;
          case 2: /* 9.0.0 */
          case 4: /* 9.1.0 */
            break;
          default: /* 8.4.3 && since 9.2.0 */
            expect(err)
                .to.be.an('array')
                .with.length(queriesCount);

            err.forEach(e => {
              expect(e).to.be.an.instanceOf(Error);
            });

            expect(err[0].code).to.equal(e.code);
            expect(err[0].message).to.equal(e.message);

            e = getColumnTypeError(client, 'abc');
            expect(err[1].code).to.equal(e.code);
            expect(err[1].message).to.equal(e.message);
        }
      }

      it('should fail all queries when they contain invalid syntax when calling batchExecuteNoQuery(queries)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();
        let queries = [
          `CREATE TABLE ${TABLE_NAME}(id xyz)`,
          `CREATE TABLE ${TABLE_NAME}(id abc)`,
        ];

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              throw new Error('batchExecuteNoQuery(queries) should have failed with an invalid syntax error.')
            })
            .catch(err => {
              verifyError(client, err, queries.length);

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

                    expect(result)
                        .to.have.property('ColumnValues')
                        .to.be.an('array')
                        .with.length(10);

                    expect(client)
                        .to.be.an('object')
                        .to.have.property('_queryResultSets')
                        .to.be.an('object')
                        .to.have.all.keys(['' + response.queryHandle]);

                    let tables = result.ColumnValues.map(row => row[0]);

                    // The first query should be committed.
                    expect(tables).to.not.contain(TABLE_NAME);

                    return client.close();
                  });
            });
      });
    });

    describe('when data includes Unicode characters', function () {
      beforeEach(testSetup.cleanup(TABLE_NAME));

      const unicodeDataArr = [
        // The following sentences mean: 'I would like to send off this package.'
        {
          lang: 'Korean',
          string: '이 소포를 부치고 싶은데요.',
        },
        {
          lang: 'Russian',
          string: 'Я хотел бы отослать этот пакет',
        },
      ];

      unicodeDataArr.forEach(data => {
        const testData = data.string;

        it(`should succeed to properly encode ${data.lang} characters`, function () {
          let client = testSetup.createDefaultCUBRIDDemodbConnection();

          return client
              .batchExecuteNoQuery(`CREATE TABLE ${TABLE_NAME}(str VARCHAR(256))`)
              .then(() => {
                return client.batchExecuteNoQuery(`INSERT INTO ${TABLE_NAME} VALUES('${testData}')`);
              })
              .then(() => {
                return client.query(`SELECT * FROM ${TABLE_NAME} WHERE str = ?`, [testData]);
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

                expect(result.ColumnValues[0][0]).to.equal(testData);

                return client.close();
              });
        });
      });
    });
  });
});
