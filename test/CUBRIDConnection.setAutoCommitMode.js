'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('setAutoCommitMode', function () {
    const TABLE_NAME = 'tbl_test';

    before(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    it('should succeed to disable the auto commit mode and commit manually', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client
          .connect()
          .then(() => {
            return client.execute(`CREATE TABLE ${TABLE_NAME}(id INT)`);
          })
          .then(() => {
            return client.setAutoCommitMode(false);
          })
          .then(() => {
            expect(client.getAutoCommitMode()).to.be.false;

            return client.execute(`INSERT INTO ${TABLE_NAME} VALUES(1)`);
          })
          .then(() => {
            return client.commit();
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
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.contain.keys(['' + response.queryHandle]);

            return client.setAutoCommitMode(true);
          })
          .then(() => {
            expect(client.getAutoCommitMode()).to.be.true;

            return client.batchExecuteNoQuery([`DROP TABLE ${TABLE_NAME}`]);
          })
          .then(() => {
            return client.close();
          })
          .then(done)
          .catch(done);
    });

    it('should succeed to disable the auto commit mode and commit manually by providing a falsy parameter 0', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client
          .connect()
          .then(() => {
            return client.execute(`CREATE TABLE ${TABLE_NAME}(id INT)`);
          })
          .then(() => {
            return client.setAutoCommitMode(0);
          })
          .then(() => {
            expect(client.getAutoCommitMode()).to.be.false;

            return client.execute(`INSERT INTO ${TABLE_NAME} VALUES(1)`);
          })
          .then(() => {
            return client.commit();
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
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.contain.keys(['' + response.queryHandle]);

            return client.setAutoCommitMode(true);
          })
          .then(() => {
            expect(client.getAutoCommitMode()).to.be.true;

            return client.batchExecuteNoQuery([`DROP TABLE ${TABLE_NAME}`]);
          })
          .then(() => {
            return client.close();
          })
          .then(done)
          .catch(done);
    });

    it('should succeed to disable the auto commit mode and commit manually by providing a falsy parameter "" (empty string)', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client
          .connect()
          .then(() => {
            return client.execute(`CREATE TABLE ${TABLE_NAME}(id INT)`);
          })
          .then(() => {
            return client.setAutoCommitMode("");
          })
          .then(() => {
            expect(client.getAutoCommitMode()).to.be.false;

            return client.execute(`INSERT INTO ${TABLE_NAME} VALUES(1)`);
          })
          .then(() => {
            return client.commit();
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
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.contain.keys(['' + response.queryHandle]);

            return client.setAutoCommitMode(true);
          })
          .then(() => {
            expect(client.getAutoCommitMode()).to.be.true;

            return client.batchExecuteNoQuery([`DROP TABLE ${TABLE_NAME}`]);
          })
          .then(() => {
            return client.close();
          })
          .then(done)
          .catch(done);
    });
  });
});
