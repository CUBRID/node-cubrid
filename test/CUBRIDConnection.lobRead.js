'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const ErrorMessages = require('../src/constants/ErrorMessages');

describe('CUBRIDConnection', function () {
  describe('lobRead', function () {
    const TABLE_NAME = 'tbl_test';
    let data = '';

    const bytesCount = 5120;

    for (var i = 0; i < bytesCount; i++) {
      // These are 8 bits representing a single byte `255`.
      // This means the `data` will have `5120` bytes stored
      // because we are storing it as a binary not text.
      data += '11111111';
    }

    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    describe('BLOB (Binary Large Object)', function () {
      const queries = [
        `CREATE TABLE ${TABLE_NAME}(lob BLOB)`,
        `INSERT INTO ${TABLE_NAME} VALUES(BIT_TO_BLOB(B'${data}'))`
      ];

      it('should succeed to lobRead() binary data', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              // The first query should be committed.
              expect(columns)
                  .to.be.an('array')
                  .with.length(1);

              const lobObject = result.ColumnValues[0][0];

              expect(lobObject)
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number');

              expect(lobObject)
                  .to.have.property('lobLength')
                  .to.be.a('number');

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.an.instanceOf(Buffer);

              const buffer = response.data;

              expect(buffer)
                  .to.have.length(bytesCount);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(bytesCount);

              for (let i = 0; i < bytesCount; ++i) {
                expect(buffer[i] === 255);
              }

              return client.close();
            });
      });

      it('should succeed to lobRead(callback) binary data', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              // The first query should be committed.
              expect(columns)
                  .to.be.an('array')
                  .with.length(1);

              const lobObject = result.ColumnValues[0][0];

              expect(lobObject)
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number');

              expect(lobObject)
                  .to.have.property('lobLength')
                  .to.be.a('number');

              return new Promise((resolve, reject) => {
                client.lobRead(lobObject, 0, lobObject.lobLength, function (err, data, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    data,
                    length,
                  });
                });
              });
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.an.instanceOf(Buffer);

              const buffer = response.data;

              expect(buffer)
                  .to.have.length(bytesCount);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(bytesCount);

              for (let i = 0; i < bytesCount; ++i) {
                expect(buffer[i] === 255);
              }

              return client.close();
            });
      });

      it('should fail to lobRead() when the `position` is invalid', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              // The first query should be committed.
              expect(columns)
                  .to.be.an('array')
                  .with.length(1);

              const lobObject = result.ColumnValues[0][0];

              expect(lobObject)
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number');

              expect(lobObject)
                  .to.have.property('lobLength')
                  .to.be.a('number');

              // `10 + lobObject.lobLength` is already beyond the
              // maximum bytes the data has.
              return client.lobRead(lobObject, 10, lobObject.lobLength);
            })
            .then(() => {
              throw new Error('Should have failed to lobRead() when the `position` is invalid');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_INVALID_LOB_POSITION);
            });
      });

      it('should fail to lobRead(callback) when the `position` is invalid', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              // The first query should be committed.
              expect(columns)
                  .to.be.an('array')
                  .with.length(1);

              const lobObject = result.ColumnValues[0][0];

              expect(lobObject)
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number');

              expect(lobObject)
                  .to.have.property('lobLength')
                  .to.be.a('number');

              return new Promise((resolve, reject) => {
                // `10 + lobObject.lobLength` is already beyond the
                // maximum bytes the data has.
                client.lobRead(lobObject, 10, lobObject.lobLength, function (err, data, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    data,
                    length,
                  });
                });
              });
            })
            .then(() => {
              throw new Error('Should have failed to lobRead() when the `position` is invalid');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_INVALID_LOB_POSITION);
            });
      });
    });
    
    describe('CLOB (Character Large Object)', function () {
      const queries = [
        `CREATE TABLE ${TABLE_NAME}(lob CLOB)`,
        `INSERT INTO ${TABLE_NAME} VALUES(CHAR_TO_CLOB('${data}'))`
      ];
      const lobLength = data.length;

      it('should succeed to lobRead() text data', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              // The first query should be committed.
              expect(columns)
                  .to.be.an('array')
                  .with.length(1);

              const lobObject = result.ColumnValues[0][0];

              expect(lobObject)
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number');

              expect(lobObject)
                  .to.have.property('lobLength')
                  .to.be.a('number')
                  .to.equal(lobLength);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(lobLength);

              const text = response.data;

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(lobLength);

              for (let i = 0; i < lobLength; ++i) {
                expect(text[i] === '1');
              }

              return client.close();
            });
      });

      it('should succeed to lobRead(callback) binary data', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              // The first query should be committed.
              expect(columns)
                  .to.be.an('array')
                  .with.length(1);

              const lobObject = result.ColumnValues[0][0];

              expect(lobObject)
                  .to.be.an('object')
                  .to.have.property('lobType')
                  .to.be.a('number');

              expect(lobObject)
                  .to.have.property('lobLength')
                  .to.be.a('number');

              return new Promise((resolve, reject) => {
                client.lobRead(lobObject, 0, lobObject.lobLength, function (err, data, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    data,
                    length,
                  });
                });
              });
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(lobLength);

              const text = response.data;

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(lobLength);

              for (let i = 0; i < lobLength; ++i) {
                expect(text[i] === '1');
              }

              return client.close();
            });
      });
    });
  });
});
