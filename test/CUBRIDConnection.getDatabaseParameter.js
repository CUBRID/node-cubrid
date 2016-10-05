'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const CAS = require('../src/constants/CASConstants');
const ErrorMessages = require('../src/constants/ErrorMessages');

describe('CUBRIDConnection', function () {
  describe('getDatabaseParameter', function () {
    it(`should succeed to set and get the database parameter`, function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      const isolationLevel = CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL;
      const tranRepClassCommitInstance = CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE;

      return client
          .setDatabaseParameter(isolationLevel, tranRepClassCommitInstance)
          .then(() => {
            return client.getDatabaseParameter(isolationLevel);
          })
          .then(value => {
            expect(value).to.equal(tranRepClassCommitInstance);

            return client.close();
          });
    });

    it(`should fail to get the database parameter`, function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      const paramName = CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH;

      return client
          .getDatabaseParameter(paramName, 0)
          .then(() => {
            return new Error('Should have failed to set the database parameter.');
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.code).to.equal(-1011);
            expect(err.message).to.equal(ErrorMessages.resolveErrorCode(err.code));

            return client.close();
          });
    });
  });
});
