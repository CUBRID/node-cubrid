'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('close', function () {
    it('should emit the "disconnect" event on close()', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();
      let disconnected = false;

      return client
          .connect()
          .then(() => {
            client.once('disconnect', function () {
              disconnected = true;
            });

            return client.close();
          })
          .then(() => {
            return new Promise(resolve => {
              setTimeout(() => {
                expect(disconnected).to.be.true;

                resolve();
              }, 300);
            });
          });
    });

    it('should succeed to close() when a connection is not established', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client.close();
    });

    it('should succeed to close(callback) when a connection is not established', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.close(done);
    });
  });
});
