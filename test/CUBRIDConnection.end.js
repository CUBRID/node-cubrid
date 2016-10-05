'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('end', function () {
    it('should succeed to close the connection using end(callback)', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .connect()
          .then(() => {
            return client.query('SELECT * FROM nation');
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
                .to.be.a('number');

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            return new Promise((resolve, reject) => {
              client.end(function (err) {
                if (err) {
                  return reject(err);
                }

                expect(client)
                    .to.be.an('object')
                    .to.have.property('_queryResultSets')
                    .to.be.an('object')
                    .to.be.empty;

                resolve();
              });
            });
          })
          .then(() => {
            return client.close();
          });
    });

    it('should succeed to close the connection using end(callback)', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .connect()
          .then(() => {
            return client.query('SELECT * FROM nation');
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
                .to.be.a('number');

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            return client
                .end()
                .then(() => {
                  expect(client)
                      .to.be.an('object')
                      .to.have.property('_queryResultSets')
                      .to.be.an('object')
                      .to.be.empty;

                  return client.close();
                });
          });
    });
  });
});
