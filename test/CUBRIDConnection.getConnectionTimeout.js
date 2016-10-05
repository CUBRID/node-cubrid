'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('getConnectionTimeout', function () {
    it('should succeed to get the connection timeout value', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();
      const newTimeoutValue = 2000;

      expect(client.getConnectionTimeout()).to.equal(0);

      client.setConnectionTimeout(newTimeoutValue);

      expect(client.getConnectionTimeout()).to.equal(newTimeoutValue);
    });
  });
});
