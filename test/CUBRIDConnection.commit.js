'use strict';

const expect = require('chai').expect;
const ErrorMessages = require('../src/constants/ErrorMessages');
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('commit', function () {
    it('should fail to commit() when a connection is offline', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client.commit()
          .then(() => {
            throw new Error(ErrorMessages.ERROR_CLOSED_CONNECTION_COMMIT);
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(ErrorMessages.ERROR_CLOSED_CONNECTION_COMMIT);
          });
    });

    it('should fail to commit(callback) when a connection is offline', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.commit(function (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal(ErrorMessages.ERROR_CLOSED_CONNECTION_COMMIT);

        done();
      });
    });

    it('should fail to commit() when a auto commit mode is enabled', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .connect()
          .then(() => {
            return client.commit();
          })
          .then(() => {
            throw new Error(ErrorMessages.ERROR_AUTO_COMMIT_ENABLED_COMMIT);
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(ErrorMessages.ERROR_AUTO_COMMIT_ENABLED_COMMIT);
          });
    });

    it('should fail to commit(callback) when a auto commit mode is enabled', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .connect()
          .then(() => {
            return new Promise((resolve, reject) => {
              client.commit(function (err) {
                if (err) {
                  return reject(err);
                }

                resolve();
              })
            });
          })
          .then(() => {
            throw new Error(ErrorMessages.ERROR_AUTO_COMMIT_ENABLED_COMMIT);
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(ErrorMessages.ERROR_AUTO_COMMIT_ENABLED_COMMIT);
          });
    });
  });
});
