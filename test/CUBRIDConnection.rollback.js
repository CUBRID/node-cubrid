'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const ErrorMessages = require('../src/constants/ErrorMessages');

describe('CUBRIDConnection', function () {
  describe('rollback', function () {
    const TABLE_NAME = 'test_tran';

    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    it('should succeed to rollback()', function () {
      const client = require('./testSetup').createDefaultCUBRIDDemodbConnection();

      return client
          .connect()
          .then(() => {
            return client.execute(`CREATE TABLE ${TABLE_NAME}(id INT)`);
          })
          .then(() => {
            return client.setAutoCommitMode(false);
          })
          .then(() => {
            return client.batchExecuteNoQuery([`INSERT INTO ${TABLE_NAME} VALUES(1)`]);
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

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(1);

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            expect(result.ColumnValues[0])
                .to.be.an('array')
                .with.length(1);

            expect(result.ColumnValues[0][0])
                .to.be.a('number')
                .to.equal(1);

            return client.rollback();
          })
          .then(() => {
            // After rollback the autocommit mode stay the same, i.e. OFF.
            // If necessary, the user has to explicitly set it to `true`
            // in order to enable the autocommit mode.
            expect(client.getAutoCommitMode()).to.be.false;

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

            return client.setAutoCommitMode(true);
          })
          .then(() => {
            return client.close();
          });
    });

    it('should succeed to rollback(callback)', function () {
      const client = require('./testSetup').createDefaultCUBRIDDemodbConnection();

      return client
          .connect()
          .then(() => {
            return client.execute(`CREATE TABLE ${TABLE_NAME}(id INT)`);
          })
          .then(() => {
            return client.setAutoCommitMode(false);
          })
          .then(() => {
            return client.batchExecuteNoQuery([`INSERT INTO ${TABLE_NAME} VALUES(1)`]);
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

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(1);

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            expect(result.ColumnValues[0])
                .to.be.an('array')
                .with.length(1);

            expect(result.ColumnValues[0][0])
                .to.be.a('number')
                .to.equal(1);

            return new Promise((resolve, reject) => {
              client.rollback(function (err) {
                if (err) {
                  return reject(err);
                }

                resolve();
              });
            });
          })
          .then(() => {
            // After rollback the autocommit mode stay the same, i.e. OFF.
            // If necessary, the user has to explicitly set it to `true`
            // in order to enable the autocommit mode.
            expect(client.getAutoCommitMode()).to.be.false;

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

            return client.setAutoCommitMode(true);
          })
          .then(() => {
            return client.close();
          });
    });

    it('should fail to rollback() when the connection is in AUTO_COMMIT_ON mode', function () {
      const client = require('./testSetup').createDefaultCUBRIDDemodbConnection();

      return client
          .rollback()
          .then(() => {
            throw new Error('Should have failed to rollback() when the connection is in AUTO_COMMIT_ON mode.')
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(ErrorMessages.ERROR_NO_ROLLBACK);
          });
    });

    it('should fail to rollback(callback) when the connection is in AUTO_COMMIT_ON mode', function (done) {
      const client = require('./testSetup').createDefaultCUBRIDDemodbConnection();

      client.rollback(function (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal(ErrorMessages.ERROR_NO_ROLLBACK);

        done();
      });
    });
  });
});
