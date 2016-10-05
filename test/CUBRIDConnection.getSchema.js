'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const CAS = require('../src/constants/CASConstants');

describe('CUBRIDConnection', function () {
  describe('getSchema', function () {
    it('should succeed to getSchema()', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      this.timeout(10000);

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_CLASS)
          .then(schema => {
            if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
              expect(schema)
                  .to.be.an('array')
                  .with.length(32);
            } else {
              expect(schema)
                  .to.be.an('array')
                  .with.length(33);
            }

            return client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_VCLASS);
          })
          .then(schema => {
            if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
              expect(schema)
                  .to.be.an('array')
                  .with.length(16);
            } else {
              expect(schema)
                  .to.be.an('array')
                  .with.length(17);
            }

            return client.close();
          });
    });

    it('should succeed to getSchema(callback)', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      this.timeout(10000);

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_CLASS, function (err, schema) {
        if (err) {
          return done(err);
        }

        if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
          expect(schema)
              .to.be.an('array')
              .with.length(32);
        } else {
          expect(schema)
              .to.be.an('array')
              .with.length(33);
        }

        client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_VCLASS, function (err, schema) {
          if (err) {
            return done(err);
          }

          if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
            expect(schema)
                .to.be.an('array')
                .with.length(16);
          } else {
            expect(schema)
                .to.be.an('array')
                .with.length(17);
          }

          client.close(done);
        });
      });
    });
  });
});
