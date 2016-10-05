'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('executeWithTypedParams', function () {
    const TABLE_NAME = 'tbl_test';

    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    const BIG_STRING_LENGTH = 10;
    const query = `
        CREATE TABLE ${TABLE_NAME}(
          a BIGINT,
          b BIT(8),
          c BIT VARYING(8),
          d CHARACTER(1),
          e DATE,
          f DATETIME,
          g DOUBLE,
          h FLOAT,
          i INTEGER,
          j MONETARY,
          k NATIONAL CHARACTER(1),
          l NATIONAL CHARACTER VARYING(100),
          m NUMERIC(15,0),
          n CHARACTER VARYING(100),
          o TIME,
          p TIMESTAMP,
          q CHARACTER VARYING(4096),
          r CHAR(${BIG_STRING_LENGTH})${/* big string test */''}
        )
        `;

    let bitValue = new Buffer(1);
    let date = new Date();
    let varBitValue = new Buffer(1);

    bitValue[0] = 0;
    date.setUTCFullYear(2012, /* 0 based; 9 is for October */9, 2);
    date.setUTCHours(13, 25, 45, 100);
    varBitValue[0] = 128;

    const valueMappings = [
      {
        type: 'bigint',
        value: 15
      },
      {
        type: 'bit',
        value: bitValue
      },
      {
        type: 'varbit',
        value: varBitValue
      },
      {
        type: 'char',
        value: 'a'
      },
      {
        type: 'date',
        value: date
      },
      {
        type: 'datetime',
        value: date
      },
      {
        type: 'double',
        value: 1.5
      },
      {
        type: 'float',
        value: 2.5
      },
      {
        type: 'int',
        value: 14
      },
      {
        type: 'monetary',
        value: 3.14
      },
      {
        type: 'nchar',
        value: '9'
      },
      {
        type: 'varnchar',
        value: '95'
      },
      {
        type: 'numeric',
        value: 16
      },
      {
        type: 'varchar',
        value: 'varnchar'
      },
      {
        type: 'time',
        value: date
      },
      {
        type: 'timestamp',
        value: date
      },
      {
        type: 'varchar',
        value: 'varchar'
      },
      {
        type: 'char',
        value: (function getRandomChars(charsCount) {
          let value = '';

          while (charsCount--) {
            value += 'A';
          }

          return value;
        })(BIG_STRING_LENGTH)
      }
    ];

    it('should succeed calling executeWithTypedParams(sql, params, delimiters)', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .batchExecuteNoQuery(query)
          .then(() => {
            const sql = `INSERT INTO ${TABLE_NAME} VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            let params = [];
            let types = [];

            valueMappings.forEach(mapping => {
              params.push(mapping.value);
              types.push(mapping.type);
            });

            return client.executeWithTypedParams(sql, params, types);
          })
          .then(() => {
            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.be.empty;

            return client.query(`SELECT * FROM ${TABLE_NAME}`);
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
                .to.be.a('number')
                .to.equal(1);

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(1);

            const values = result.ColumnValues[0];
            
            expect(values)
                .to.be.an('array')
                .with.length(valueMappings.length);

            expect(values[0])
                .to.be.a('number')
                .to.equal(valueMappings[0].value);

            expect(values[1])
                .to.be.an.instanceOf(Buffer);

            expect(values[1])
                .to.have.length(1);

            expect(values[1][0])
                .to.equal(valueMappings[1].value[0]);

            expect(values[2])
                .to.be.an.instanceOf(Buffer);

            expect(values[2])
                .to.have.length(1);

            expect(values[2][0])
                .to.equal(valueMappings[2].value[0]);

            expect(values[3])
                .to.be.a('string')
                .to.equal(valueMappings[3].value);

            expect(values[4])
                .to.be.an.instanceOf(Date);

            // We cannot directly compare the date values because
            // an instance of `Date` removes time information when
            // storing the data in CUBRID into `DATE` type.
            let dateOnly = new Date(valueMappings[4].value);
            dateOnly.setUTCHours(0, 0, 0, 0);

            expect(values[4])
                .to.deep.equal(dateOnly);

            expect(values[5])
                .to.be.an.instanceOf(Date);

            expect(values[5])
                .to.deep.equal(valueMappings[5].value);

            expect(values[6])
                .to.be.a('number')
                .to.equal(valueMappings[6].value);

            expect(values[7])
                .to.be.a('number')
                .to.equal(valueMappings[7].value);

            expect(values[8])
                .to.be.a('number')
                .to.equal(valueMappings[8].value);

            expect(values[9])
                .to.be.a('number')
                .to.equal(valueMappings[9].value);

            expect(values[10])
                .to.be.a('string')
                .to.equal(valueMappings[10].value);

            expect(values[11])
                .to.be.a('string')
                .to.equal(valueMappings[11].value);

            expect(values[12])
                .to.be.a('number')
                .to.equal(valueMappings[12].value);

            expect(values[13])
                .to.be.a('string')
                .to.equal(valueMappings[13].value);

            expect(values[14])
                .to.be.an.instanceOf(Date);

            // We cannot directly compare the date values because
            // an instance of `Date` removes date information when
            // storing the data in CUBRID as a `TIME` type.
            let timeOnly = new Date(valueMappings[14].value);
            timeOnly.setUTCFullYear(1970, 0, 1);
            // `TIME` in CUBRID does not include the millisecond part.
            timeOnly.setMilliseconds(0);

            expect(values[14])
                .to.deep.equal(timeOnly);

            expect(values[15])
                .to.be.an.instanceOf(Date);

            // We cannot directly compare the date values because
            // an instance of `Date` removes millisecond information when
            // storing the data in CUBRID as a `TIMESTAMP` type.
            let timestamp = new Date(valueMappings[15].value);
            timestamp.setMilliseconds(0);

            expect(values[15])
                .to.deep.equal(timestamp);

            expect(values[16])
                .to.be.a('string')
                .to.equal(valueMappings[16].value);

            expect(values[17])
                .to.be.a('string')
                .with.length(BIG_STRING_LENGTH);

            expect(values[17]).to.satisfy(function (str) {
              return str.indexOf(valueMappings[17].value) === 0;
            });

            return client.close();
          });
    });

    it('should succeed calling executeWithTypedParams(sql, params, delimiters, callback)', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .batchExecuteNoQuery(query)
          .then(() => {
            const sql = `INSERT INTO ${TABLE_NAME} VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            let params = [];
            let types = [];

            valueMappings.forEach(mapping => {
              params.push(mapping.value);
              types.push(mapping.type);
            });

            return new Promise((resolve, reject) => {
              client.executeWithTypedParams(sql, params, types, function (err) {
                if (err) {
                  return reject(err);
                }

                resolve();
              });
            });
          })
          .then(() => {
            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.be.empty;

            return client.query(`SELECT * FROM ${TABLE_NAME}`);
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
                .to.be.a('number')
                .to.equal(1);

            expect(client)
                .to.be.an('object')
                .to.have.property('_queryResultSets')
                .to.be.an('object')
                .to.have.all.keys(['' + response.queryHandle]);

            expect(result)
                .to.have.property('ColumnValues')
                .to.be.an('array')
                .with.length(1);

            const values = result.ColumnValues[0];

            expect(values)
                .to.be.an('array')
                .with.length(valueMappings.length);

            expect(values[0])
                .to.be.a('number')
                .to.equal(valueMappings[0].value);

            expect(values[1])
                .to.be.an.instanceOf(Buffer);

            expect(values[1])
                .to.have.length(1);

            expect(values[1][0])
                .to.equal(valueMappings[1].value[0]);

            expect(values[2])
                .to.be.an.instanceOf(Buffer);

            expect(values[2])
                .to.have.length(1);

            expect(values[2][0])
                .to.equal(valueMappings[2].value[0]);

            expect(values[3])
                .to.be.a('string')
                .to.equal(valueMappings[3].value);

            expect(values[4])
                .to.be.an.instanceOf(Date);

            // We cannot directly compare the date values because
            // an instance of `Date` removes time information when
            // storing the data in CUBRID into `DATE` type.
            let dateOnly = new Date(valueMappings[4].value);
            dateOnly.setUTCHours(0, 0, 0, 0);

            expect(values[4])
                .to.deep.equal(dateOnly);

            expect(values[5])
                .to.be.an.instanceOf(Date);

            expect(values[5])
                .to.deep.equal(valueMappings[5].value);

            expect(values[6])
                .to.be.a('number')
                .to.equal(valueMappings[6].value);

            expect(values[7])
                .to.be.a('number')
                .to.equal(valueMappings[7].value);

            expect(values[8])
                .to.be.a('number')
                .to.equal(valueMappings[8].value);

            expect(values[9])
                .to.be.a('number')
                .to.equal(valueMappings[9].value);

            expect(values[10])
                .to.be.a('string')
                .to.equal(valueMappings[10].value);

            expect(values[11])
                .to.be.a('string')
                .to.equal(valueMappings[11].value);

            expect(values[12])
                .to.be.a('number')
                .to.equal(valueMappings[12].value);

            expect(values[13])
                .to.be.a('string')
                .to.equal(valueMappings[13].value);

            expect(values[14])
                .to.be.an.instanceOf(Date);

            // We cannot directly compare the date values because
            // an instance of `Date` removes date information when
            // storing the data in CUBRID as a `TIME` type.
            let timeOnly = new Date(valueMappings[14].value);
            timeOnly.setUTCFullYear(1970, 0, 1);
            // `TIME` in CUBRID does not include the millisecond part.
            timeOnly.setMilliseconds(0);

            expect(values[14])
                .to.deep.equal(timeOnly);

            expect(values[15])
                .to.be.an.instanceOf(Date);

            // We cannot directly compare the date values because
            // an instance of `Date` removes millisecond information when
            // storing the data in CUBRID as a `TIMESTAMP` type.
            let timestamp = new Date(valueMappings[15].value);
            timestamp.setMilliseconds(0);

            expect(values[15])
                .to.deep.equal(timestamp);

            expect(values[16])
                .to.be.a('string')
                .to.equal(valueMappings[16].value);

            expect(values[17])
                .to.be.a('string')
                .with.length(BIG_STRING_LENGTH);

            expect(values[17]).to.satisfy(function (str) {
              return str.indexOf(valueMappings[17].value) === 0;
            });

            return client.close();
          });
    });

    it('should fail calling executeWithTypedParams(sql, params, delimiters) when the INSERT query has less "?" parameter placeholders than the provided number of parameters', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .batchExecuteNoQuery(query)
          .then(() => {
            const sql = `INSERT INTO ${TABLE_NAME} VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            let params = [];
            let types = [];

            valueMappings.forEach(mapping => {
              params.push(mapping.value);
              types.push(mapping.type);
            });

            return client.executeWithTypedParams(sql, params, types);
          })
          .then(() => {
            return new Error('executeWithTypedParams() should have failed with an invalid query.')
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);

            expect(err)
                .to.have.property('code')
                .to.be.a('number');

            if (client.brokerInfo.protocolVersion === 2) {
              expect(err.code)
                  .to.equal(-10007);
            } else {
              expect(err.code)
                .to.equal(-1007);
            }

            expect(err)
                .to.have.property('message')
                .to.be.a('string')
                .to.equal('CAS_ER_NUM_BIND');
          });
    });

    it('should fail calling executeWithTypedParams(sql, params, delimiters, callback) when the INSERT query has less "?" parameter placeholders than the provided number of parameters', function () {
      let client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
          .batchExecuteNoQuery(query)
          .then(() => {
            const sql = `INSERT INTO ${TABLE_NAME} VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            let params = [];
            let types = [];

            valueMappings.forEach(mapping => {
              params.push(mapping.value);
              types.push(mapping.type);
            });

            return new Promise((resolve, reject) => {
              client.executeWithTypedParams(sql, params, types, function (err) {
                if (err) {
                  return reject(err);
                }

                resolve();
              });
            });
          })
          .then(() => {
            return new Error('executeWithTypedParams() should have failed with an invalid query.')
          })
          .catch(err => {
            expect(err).to.be.an.instanceOf(Error);

            expect(err)
                .to.have.property('code')
                .to.be.a('number');

            if (client.brokerInfo.protocolVersion === 2) {
              expect(err.code)
                  .to.equal(-10007);
            } else {
              expect(err.code)
                  .to.equal(-1007);
            }

            expect(err)
                .to.have.property('message')
                .to.be.a('string')
                .to.equal('CAS_ER_NUM_BIND');
          });
    });
  });
});
