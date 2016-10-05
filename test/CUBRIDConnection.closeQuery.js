'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const ErrorMessages = require('../src/constants/ErrorMessages');

describe('CUBRIDConnection', function () {
  describe('closeQuery', function () {
    it('should fail to closeQuery() with an invalid query handle', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();
      const queryHandle = 1234;

      return client.closeQuery(queryHandle)
          .then(() => {
            throw new Error('Should have failed to close the query with an invalid query handle.')
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(`${ErrorMessages.ERROR_NO_ACTIVE_QUERY}: ${queryHandle}`);
          });
    });

    it('should fail to closeQuery(callback) with an invalid query handle', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();
      const queryHandle = 1234;

      client.closeQuery(queryHandle, function (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal(`${ErrorMessages.ERROR_NO_ACTIVE_QUERY}: ${queryHandle}`);

        done();
      });
    });

    it('should fail to closeQuery() with an undefined query handle', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();
      let queryHandle;

      return client.closeQuery(queryHandle)
          .then(() => {
            throw new Error('Should have failed to close the query with an invalid query handle.')
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(`${ErrorMessages.ERROR_NO_ACTIVE_QUERY}: ${queryHandle}`);
          });
    });

    it('should fail to closeQuery(callback) with an invalid query handle', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();
      let queryHandle;

      client.closeQuery(queryHandle, function (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal(`${ErrorMessages.ERROR_NO_ACTIVE_QUERY}: ${queryHandle}`);

        done();
      });
    });
  });
});
