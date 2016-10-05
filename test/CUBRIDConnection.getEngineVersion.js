'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const CUBRID = require('../');

describe('CUBRIDConnection', function () {
  describe('getEngineVersion', function () {
    it('should succeed to call getEngineVersion()', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getEngineVersion()
          .then(version => {
            expect(version)
                .to.be.a('string')
                .with.length.above(0);
          });
    });

    it('should succeed to call getEngineVersion(callback)', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getEngineVersion(function (err, version) {
        if (err) {
          return done(err);
        }

        expect(version)
            .to.be.a('string')
            .with.length.above(0);

        done();
      });
    });

    it('should fail to getEngineVersion() when the connection is not established', function () {
      const client = new CUBRID.createConnection('zzz host');
      const timeout = 3000;

      this.timeout(timeout * 2);
      client.setConnectionTimeout(timeout);

      return client
          .getEngineVersion()
          .then(() => {
            throw new Error('The connection should have failed.');
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.contain('getaddrinfo ENOTFOUND');
          });
    });

    it('should fail to getEngineVersion(callback) when the connection is not established', function (done) {
      const client = new CUBRID.createConnection('zzz host');
      const timeout = 3000;

      this.timeout(timeout * 2);
      client.setConnectionTimeout(timeout);

      client.getEngineVersion(function (err, version) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('getaddrinfo ENOTFOUND');
        expect(version).to.be.undefined;

        done();
      });
    });
  });
});
