'use strict';

const expect = require('chai').expect;

describe('CUBRIDConnection', function () {
  describe('setConnectionTimeout', function () {
    it('should succeed to set the connection timeout value', function () {
      const CUBRID = require('../');
      const ErrorMessages = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/ErrorMessages');
      const client = new CUBRID.createCUBRIDConnection('www.google.com', 33000, 'public', '', 'demodb');
      const newTimeoutValue = 1500;

      expect(client.getConnectionTimeout()).to.equal(0);

      client.setConnectionTimeout(newTimeoutValue);
      expect(client.getConnectionTimeout()).to.equal(newTimeoutValue);

      client.setConnectionTimeout(0);
      expect(client.getConnectionTimeout()).to.equal(0);

      client.setConnectionTimeout(-3000);
      expect(client.getConnectionTimeout()).to.equal(0);

      client.setConnectionTimeout(newTimeoutValue);
      expect(client.getConnectionTimeout()).to.equal(newTimeoutValue);

      client.setConnectionTimeout(newTimeoutValue);
      expect(client.getConnectionTimeout()).to.equal(newTimeoutValue);

      // By default the client will retry the connection one more time
      // if it failed, so the timeout should be increased.
      this.timeout(newTimeoutValue * 3);

      return client
          .connect()
          .then(() => {
            throw new Error('Connection should have failed.');
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.equal(ErrorMessages.ERROR_CONNECTION_TIMEOUT);
            expect(client.connectionOpened).to.be.false;
          });
    });
  });
});
