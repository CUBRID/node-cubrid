'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const CAS = require('../src/constants/CASConstants');

describe('CUBRIDConnection', function () {
  describe('getSchema', function () {
    it('should succeed to getSchema() for CCI_SCH_CLASS', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

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

            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_CLASS', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

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

        client.close(done);
      });
    });

    it('should succeed to getSchema() for CCI_SCH_VCLASS', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_VCLASS)
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

    it('should succeed to getSchema(callback) for CCI_SCH_VCLASS', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

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

    it('should succeed to getSchema() for CCI_SCH_CLASS_PRIVILEGE', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_CLASS_PRIVILEGE)
          .then(schema => {
            if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
              expect(schema)
                  .to.be.an('array')
                  .with.length(96);
            } else {
              expect(schema)
                  .to.be.an('array')
                  .with.length(97);
            }

            const table = schema[0];

            expect(table)
                .to.be.an('object')
                .to.have.property('TableName')
                .to.be.a('string')
                .to.equal('db_root');

            expect(table)
                .to.have.property('Privilege')
                .to.be.a('string')
                .to.equal('SELECT');

            expect(table)
                .to.have.property('Grantable')
                .to.be.false;

            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_CLASS_PRIVILEGE', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_CLASS_PRIVILEGE, function (err, schema) {
        if (err) {
          return done(err);
        }

        if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
          expect(schema)
              .to.be.an('array')
              .with.length(96);
        } else {
          expect(schema)
              .to.be.an('array')
              .with.length(97);
        }

        const table = schema[0];

        expect(table)
            .to.be.an('object')
            .to.have.property('TableName')
            .to.be.a('string')
            .to.equal('db_root');

        expect(table)
            .to.have.property('Privilege')
            .to.be.a('string')
            .to.equal('SELECT');

        expect(table)
            .to.have.property('Grantable')
            .to.be.false;

        client.close(done);
      });
    });

    it('should succeed to getSchema() for CCI_SCH_CONSTRAINT for "event" table', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_CONSTRAINT, 'event')
          .then(schema => {
            expect(schema)
                .to.be.an('array')
                .with.length(0);
            
            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_CONSTRAINT for "event" table', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_CONSTRAINT, 'event', function (err, schema) {
        if (err) {
          return done(err);
        }

        expect(schema)
            .to.be.an('array')
            .with.length(0);

        client.close(done);
      });
    });

    it('should succeed to getSchema() for CCI_SCH_EXPORTED_KEYS for "athlete" table', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_EXPORTED_KEYS, 'athlete')
          .then(schema => {
            expect(schema)
                .to.be.an('array')
                .with.length(1);

            const table = schema[0];

            expect(table)
                .to.be.an('object')
                .to.have.property('FkName')
                .to.be.a('string')
                .to.equal('fk_game_athlete_code');

            expect(table)
                .to.be.an('object')
                .to.have.property('PkName')
                .to.be.a('string')
                .to.equal('pk_athlete_code');

            expect(table)
                .to.be.an('object')
                .to.have.property('FkTableName')
                .to.be.a('string')
                .to.equal('game');

            expect(table)
                .to.be.an('object')
                .to.have.property('PkTableName')
                .to.be.a('string')
                .to.equal('athlete');

            expect(table)
                .to.be.an('object')
                .to.have.property('FkColumnName')
                .to.be.a('string')
                .to.equal('athlete_code');

            expect(table)
                .to.be.an('object')
                .to.have.property('PkColumnName')
                .to.be.a('string')
                .to.equal('code');

            expect(table)
                .to.be.an('object')
                .to.have.property('UpdateAction')
                .to.be.a('number')
                .to.equal(1);

            expect(table)
                .to.be.an('object')
                .to.have.property('DeleteAction')
                .to.be.a('number')
                .to.equal(1);

            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_EXPORTED_KEYS for "athlete" table', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_EXPORTED_KEYS, 'athlete', function (err, schema) {
        if (err) {
          return done(err);
        }

        expect(schema)
            .to.be.an('array')
            .with.length(1);

        const table = schema[0];

        expect(table)
            .to.be.an('object')
            .to.have.property('FkName')
            .to.be.a('string')
            .to.equal('fk_game_athlete_code');

        expect(table)
            .to.be.an('object')
            .to.have.property('PkName')
            .to.be.a('string')
            .to.equal('pk_athlete_code');

        expect(table)
            .to.be.an('object')
            .to.have.property('FkTableName')
            .to.be.a('string')
            .to.equal('game');

        expect(table)
            .to.be.an('object')
            .to.have.property('PkTableName')
            .to.be.a('string')
            .to.equal('athlete');

        expect(table)
            .to.be.an('object')
            .to.have.property('FkColumnName')
            .to.be.a('string')
            .to.equal('athlete_code');

        expect(table)
            .to.be.an('object')
            .to.have.property('PkColumnName')
            .to.be.a('string')
            .to.equal('code');

        expect(table)
            .to.be.an('object')
            .to.have.property('UpdateAction')
            .to.be.a('number')
            .to.equal(1);

        expect(table)
            .to.be.an('object')
            .to.have.property('DeleteAction')
            .to.be.a('number')
            .to.equal(1);

        client.close(done);
      });
    });

    it('should succeed to getSchema() for CCI_SCH_IMPORTED_KEYS for "game" table', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_IMPORTED_KEYS, 'game')
          .then(schema => {
            expect(schema)
                .to.be.an('array')
                .with.length(2);

            let table1 = schema[0];
            let table2 = schema[1];

            if ([/* 9.0.0 */2, /* 9.1.0 */4].indexOf(client.brokerInfo.protocolVersion) > -1) {
              let t = table1;
              table1 = table2;
              table2 = t;
            }

            expect(table1)
                .to.be.an('object')
                .to.have.property('FkName')
                .to.be.a('string')
                .to.equal('fk_game_athlete_code');

            expect(table1)
                .to.be.an('object')
                .to.have.property('PkName')
                .to.be.a('string')
                .to.equal('pk_athlete_code');

            expect(table1)
                .to.be.an('object')
                .to.have.property('FkTableName')
                .to.be.a('string')
                .to.equal('game');

            expect(table1)
                .to.be.an('object')
                .to.have.property('PkTableName')
                .to.be.a('string')
                .to.equal('athlete');

            expect(table1)
                .to.be.an('object')
                .to.have.property('FkColumnName')
                .to.be.a('string')
                .to.equal('athlete_code');

            expect(table1)
                .to.be.an('object')
                .to.have.property('PkColumnName')
                .to.be.a('string')
                .to.equal('code');

            expect(table1)
                .to.be.an('object')
                .to.have.property('UpdateAction')
                .to.be.a('number')
                .to.equal(1);

            expect(table1)
                .to.be.an('object')
                .to.have.property('DeleteAction')
                .to.be.a('number')
                .to.equal(1);

            expect(table2)
                .to.be.an('object')
                .to.have.property('FkName')
                .to.be.a('string')
                .to.equal('fk_game_event_code');

            expect(table2)
                .to.be.an('object')
                .to.have.property('PkName')
                .to.be.a('string')
                .to.equal('pk_event_code');

            expect(table2)
                .to.be.an('object')
                .to.have.property('FkTableName')
                .to.be.a('string')
                .to.equal('game');

            expect(table2)
                .to.be.an('object')
                .to.have.property('PkTableName')
                .to.be.a('string')
                .to.equal('event');

            expect(table2)
                .to.be.an('object')
                .to.have.property('FkColumnName')
                .to.be.a('string')
                .to.equal('event_code');

            expect(table2)
                .to.be.an('object')
                .to.have.property('PkColumnName')
                .to.be.a('string')
                .to.equal('code');

            expect(table2)
                .to.be.an('object')
                .to.have.property('UpdateAction')
                .to.be.a('number')
                .to.equal(1);

            expect(table2)
                .to.be.an('object')
                .to.have.property('DeleteAction')
                .to.be.a('number')
                .to.equal(1);

            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_IMPORTED_KEYS for "game" table', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_IMPORTED_KEYS, 'game', function (err, schema) {
        if (err) {
          return done(err);
        }

        expect(schema)
            .to.be.an('array')
            .with.length(2);

        let table1 = schema[0];
        let table2 = schema[1];

        if ([/* 9.0.0 */2, /* 9.1.0 */4].indexOf(client.brokerInfo.protocolVersion) > -1) {
          let t = table1;
          table1 = table2;
          table2 = t;
        }

        expect(table1)
            .to.be.an('object')
            .to.have.property('FkName')
            .to.be.a('string')
            .to.equal('fk_game_athlete_code');

        expect(table1)
            .to.be.an('object')
            .to.have.property('PkName')
            .to.be.a('string')
            .to.equal('pk_athlete_code');

        expect(table1)
            .to.be.an('object')
            .to.have.property('FkTableName')
            .to.be.a('string')
            .to.equal('game');

        expect(table1)
            .to.be.an('object')
            .to.have.property('PkTableName')
            .to.be.a('string')
            .to.equal('athlete');

        expect(table1)
            .to.be.an('object')
            .to.have.property('FkColumnName')
            .to.be.a('string')
            .to.equal('athlete_code');

        expect(table1)
            .to.be.an('object')
            .to.have.property('PkColumnName')
            .to.be.a('string')
            .to.equal('code');

        expect(table1)
            .to.be.an('object')
            .to.have.property('UpdateAction')
            .to.be.a('number')
            .to.equal(1);

        expect(table1)
            .to.be.an('object')
            .to.have.property('DeleteAction')
            .to.be.a('number')
            .to.equal(1);

        expect(table2)
            .to.be.an('object')
            .to.have.property('FkName')
            .to.be.a('string')
            .to.equal('fk_game_event_code');

        expect(table2)
            .to.be.an('object')
            .to.have.property('PkName')
            .to.be.a('string')
            .to.equal('pk_event_code');

        expect(table2)
            .to.be.an('object')
            .to.have.property('FkTableName')
            .to.be.a('string')
            .to.equal('game');

        expect(table2)
            .to.be.an('object')
            .to.have.property('PkTableName')
            .to.be.a('string')
            .to.equal('event');

        expect(table2)
            .to.be.an('object')
            .to.have.property('FkColumnName')
            .to.be.a('string')
            .to.equal('event_code');

        expect(table2)
            .to.be.an('object')
            .to.have.property('PkColumnName')
            .to.be.a('string')
            .to.equal('code');

        expect(table2)
            .to.be.an('object')
            .to.have.property('UpdateAction')
            .to.be.a('number')
            .to.equal(1);

        expect(table2)
            .to.be.an('object')
            .to.have.property('DeleteAction')
            .to.be.a('number')
            .to.equal(1);

        client.close(done);
      });
    });

    it('should succeed to getSchema() for CCI_SCH_PRIMARY_KEY for "athlete" table', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_PRIMARY_KEY, 'athlete')
          .then(schema => {
            expect(schema)
                .to.be.an('array')
                .with.length(1);

            const table = schema[0];

            expect(table)
                .to.be.an('object')
                .to.have.property('TableName')
                .to.be.a('string')
                .to.equal('athlete');

            expect(table)
                .to.be.an('object')
                .to.have.property('ColumnName')
                .to.be.a('string')
                .to.equal('code');

            expect(table)
                .to.be.an('object')
                .to.have.property('KeyName')
                .to.be.a('string')
                .to.equal('pk_athlete_code');

            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_PRIMARY_KEY for "athlete" table', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_PRIMARY_KEY, 'athlete', function (err, schema) {
        if (err) {
          return done(err);
        }

        expect(schema)
            .to.be.an('array')
            .with.length(1);

        const table = schema[0];

        expect(table)
            .to.be.an('object')
            .to.have.property('TableName')
            .to.be.a('string')
            .to.equal('athlete');

        expect(table)
            .to.be.an('object')
            .to.have.property('ColumnName')
            .to.be.a('string')
            .to.equal('code');

        expect(table)
            .to.be.an('object')
            .to.have.property('KeyName')
            .to.be.a('string')
            .to.equal('pk_athlete_code');

        client.close(done);
      });
    });

    it('should succeed to getSchema() for CCI_SCH_ATTRIBUTE', function () {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .getSchema(CAS.CUBRIDSchemaType.CCI_SCH_ATTRIBUTE)
          .then(schema => {
            if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
              expect(schema)
                  .to.be.an('array')
                  .with.length(191);
            } else {
              expect(schema)
                  .to.be.an('array')
                  .with.length(212);
            }

            const table = schema[0];
            
            expect(table)
                .to.be.an('object')
                .to.have.property('Name')
                .to.be.a('string')
                .to.equal('code');

            expect(table)
                .to.be.an('object')
                .to.have.property('Scale')
                .to.be.a('number')
                .to.equal(0);

            expect(table)
                .to.be.an('object')
                .to.have.property('Precision')
                .to.be.a('number');

            if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
              expect(table.Precision)
                  .to.equal(0);
            } else {
              expect(table.Precision)
                  .to.equal(10);
            }

            expect(table)
                .to.be.an('object')
                .to.have.property('NonNull')
                .to.be.a('boolean')
                .to.be.true;

            expect(table)
                .to.be.an('object')
                .to.have.property('Unique')
                .to.be.a('boolean')
                .to.be.true;

            expect(table)
                .to.be.an('object')
                .to.have.property('ClassName')
                .to.be.a('string')
                .to.equal('athlete');

            expect(table)
                .to.be.an('object')
                .to.have.property('SourceClass')
                .to.be.a('string')
                .to.equal('athlete');

            expect(table)
                .to.be.an('object')
                .to.have.property('IsKey')
                .to.be.a('boolean')
                .to.be.true;

            return client.close();
          });
    });

    it('should succeed to getSchema(callback) for CCI_SCH_ATTRIBUTE', function (done) {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      client.getSchema(CAS.CUBRIDSchemaType.CCI_SCH_ATTRIBUTE, function (err, schema) {
        if (err) {
          return done(err);
        }

        if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
          expect(schema)
              .to.be.an('array')
              .with.length(191);
        } else {
          expect(schema)
              .to.be.an('array')
              .with.length(212);
        }

        const table = schema[0];

        expect(table)
            .to.be.an('object')
            .to.have.property('Name')
            .to.be.a('string')
            .to.equal('code');

        expect(table)
            .to.be.an('object')
            .to.have.property('Scale')
            .to.be.a('number')
            .to.equal(0);

        expect(table)
            .to.be.an('object')
            .to.have.property('Precision')
            .to.be.a('number');

        if ([/* 8.4.1 */1, /* 8.4.3 */3].indexOf(client.brokerInfo.protocolVersion) > -1) {
          expect(table.Precision)
              .to.equal(0);
        } else {
          expect(table.Precision)
              .to.equal(10);
        }

        expect(table)
            .to.be.an('object')
            .to.have.property('NonNull')
            .to.be.a('boolean')
            .to.be.true;

        expect(table)
            .to.be.an('object')
            .to.have.property('Unique')
            .to.be.a('boolean')
            .to.be.true;

        expect(table)
            .to.be.an('object')
            .to.have.property('ClassName')
            .to.be.a('string')
            .to.equal('athlete');

        expect(table)
            .to.be.an('object')
            .to.have.property('SourceClass')
            .to.be.a('string')
            .to.equal('athlete');

        expect(table)
            .to.be.an('object')
            .to.have.property('IsKey')
            .to.be.a('boolean')
            .to.be.true;

        client.close(done);
      });
    });
  });
});
