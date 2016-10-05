'use strict';

const expect = require('chai').expect;
const CAS = require('../src/constants/CASConstants');
const ErrorMessages = require('../src/constants/ErrorMessages');
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('lobWrite', function () {
    const TABLE_NAME = 'tbl_test';
    const tempTableName = 'ces_temp';
    const tempLOBFileLocatorRE = new RegExp(`file:.+/demodb/.+/${tempTableName}\.[\\d_]+`);

    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    function validateLOBObject(lobObject, type, length, re) {
      expect(lobObject)
          .to.be.an('object')
          .to.have.property('lobType')
          .to.equal(type);

      if (!re) {
        re = new RegExp(`file:.+/demodb/.+/${TABLE_NAME}\.[\\d_]+`);
      }

      expect(lobObject)
          .to.have.property('fileLocator')
          .to.be.a('string')
          .to.match(re);

      expect(lobObject)
          .to.have.property('lobLength')
          .to.be.a('number')
          .to.equal(length);

      expect(lobObject)
          .to.have.property('packedLobHandle')
          .to.be.an.instanceOf(Buffer);

      expect(lobObject.packedLobHandle)
          .to.have.length(lobObject.fileLocator.length + /* db_type */4 + /* log size*/ 8 + /* locator size */ 4 + /* null */1);
    }

    describe('BLOB (Binary Large Object)', function () {
      const queries = [
        `CREATE TABLE ${TABLE_NAME}(id INT, lob BLOB)`,
      ];

      it('should succeed to write a new BLOB object using lobWrite()', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        const maxBytes = 2 * client._LOB_MAX_IO_LENGTH;
        let data = new Buffer(maxBytes);

        for (let i = 0; i < maxBytes; ++i) {
          data[i] = i % 8;
        }

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, /* initial size */0, tempLOBFileLocatorRE);

              return client.lobWrite(lobObject, 0, data);
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['blob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.an.instanceOf(Buffer);

              const buffer = response.data;

              expect(buffer)
                  .to.have.length(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              for (let i = 0; i < maxBytes; ++i) {
                expect(buffer[i] === i % 8);
              }

              return client.close();
            });
      });

      it('should succeed to write a new BLOB object using lobWrite(callback)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        const maxBytes = 2 * client._LOB_MAX_IO_LENGTH;
        let data = new Buffer(maxBytes);

        for (let i = 0; i < maxBytes; ++i) {
          data[i] = i % 8;
        }

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return new Promise((resolve, reject) => {
                client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, function (err, lobObject) {
                  if (err) {
                    return reject(err);
                  }

                  resolve(lobObject);
                });
              });
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, /* initial size */0, tempLOBFileLocatorRE);

              return new Promise((resolve, reject) => {
                client.lobWrite(lobObject, 0, data, function (err, lobObject, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    length,
                    lobObject,
                  });
                });
              });
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['blob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.an.instanceOf(Buffer);

              const buffer = response.data;

              expect(buffer)
                  .to.have.length(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              for (let i = 0; i < maxBytes; ++i) {
                expect(buffer[i] === i % 8);
              }

              return client.close();
            });
      });
      
      it('should fail to write a new BLOB object using lobWrite(callback) when an invalid "offset" is provided', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        const maxBytes = 2 * client._LOB_MAX_IO_LENGTH;
        let data = new Buffer(maxBytes);

        for (let i = 0; i < maxBytes; ++i) {
          data[i] = i % 8;
        }

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return new Promise((resolve, reject) => {
                client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, function (err, lobObject) {
                  if (err) {
                    return reject(err);
                  }

                  resolve(lobObject);
                });
              });
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, /* initial size */0, tempLOBFileLocatorRE);

              return new Promise((resolve, reject) => {
                /* pass an invalid offset, i.e. not equal to `lobObject.lobLength`. */
                client.lobWrite(lobObject, 1, data, function (err, lobObject, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    length,
                    lobObject,
                  });
                });
              });
            })
            .then(() => {
              throw new Error('Should have failed to `lobWrite` when an invalid "offset" is provided.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_INVALID_LOB_POSITION);
            });
      });

      it('should fail to write a new BLOB object using lobWrite() when an invalid "offset" is provided', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        const maxBytes = 2 * client._LOB_MAX_IO_LENGTH;
        let data = new Buffer(maxBytes);

        for (let i = 0; i < maxBytes; ++i) {
          data[i] = i % 8;
        }

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, /* initial size */0, tempLOBFileLocatorRE);

              /* pass an invalid offset, i.e. not equal to `lobObject.lobLength`. */
              return client.lobWrite(lobObject, 1, data);
            })
            .then(() => {
              throw new Error('Should have failed to `lobWrite` when an invalid "offset" is provided.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_INVALID_LOB_POSITION);
            });
      });

      it('should fail to write a new BLOB object using lobWrite() when an invalid LOB data is provided', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, /* initial size */0, tempLOBFileLocatorRE);

              return client.lobWrite(lobObject, 0, /* LOB data */1234);
            })
            .then(() => {
              throw new Error('Should have failed to `lobWrite` when an invalid LOB data is provided.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_INVALID_LOB_DATA);
            });
      });

      it('should fail to write a new BLOB object using lobWrite(callback) when an invalid "lobType" is provided', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, /* initial size */0, tempLOBFileLocatorRE);

              return new Promise((resolve, reject) => {
                client.lobWrite(lobObject, 0, /* LOB data */1234, function (err, lobObject, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    length,
                    lobObject,
                  });
                });
              });
            })
            .then(() => {
              throw new Error('Should have failed to `lobWrite` when an invalid LOB data is provided.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_INVALID_LOB_DATA);
            });
      });
    });

    describe('CLOB (Character Large Object)', function () {
      const queries = [
        `CREATE TABLE ${TABLE_NAME}(id INT, lob CLOB)`,
      ];

      it('should succeed to write a new CLOB object using lobWrite()', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        const maxBytes = 2 * client._LOB_MAX_IO_LENGTH;
        let data = '';
        const CAPITAL_LETTERS_ASCII_RANGE = /* letter Z*/90 - /* letter A*/65;

        for (let i = 0; i < maxBytes; ++i) {
          data += String.fromCharCode(65 + i % CAPITAL_LETTERS_ASCII_RANGE);
        }

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, /* initial size */0, tempLOBFileLocatorRE);

              return client.lobWrite(lobObject, 0, data);
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['clob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              const text = response.data;

              for (let i = 0; i < maxBytes; ++i) {
                expect(text[i]).to.equal(String.fromCharCode(65 + i % CAPITAL_LETTERS_ASCII_RANGE));
              }

              return client.close();
            });
      });

      it('should succeed to write a new CLOB object using lobWrite(callback)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        const maxBytes = 2 * client._LOB_MAX_IO_LENGTH;
        let data = '';
        const CAPITAL_LETTERS_ASCII_RANGE = /* letter Z*/90 - /* letter A*/65;

        for (let i = 0; i < maxBytes; ++i) {
          data += String.fromCharCode(65 + i % CAPITAL_LETTERS_ASCII_RANGE);
        }

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return new Promise((resolve, reject) => {
                client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, function (err, lobObject) {
                  if (err) {
                    return reject(err);
                  }

                  resolve(lobObject);
                });
              });
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, /* initial size */0, tempLOBFileLocatorRE);

              return new Promise((resolve, reject) => {
                client.lobWrite(lobObject, 0, data, function (err, lobObject, length) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    length,
                    lobObject,
                  });
                });
              });
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['clob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              const text = response.data;

              for (let i = 0; i < maxBytes; ++i) {
                expect(text[i]).to.equal(String.fromCharCode(65 + i % CAPITAL_LETTERS_ASCII_RANGE));
              }

              return client.close();
            });
      });

      it('should succeed to write a new Korean Unicode CLOB using lobWrite()', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        let data = '';

        for (let i = 0; i < client._LOB_MAX_IO_LENGTH; ++i) {
          // These are 3-byte characters.
          data += '이';
        }

        // Ensure the data is bigger than the `client._LOB_MAX_IO_LENGTH`.
        data += '이렇께';

        let maxBytes = Buffer.byteLength(data);

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, /* initial size */0, tempLOBFileLocatorRE);

              return client.lobWrite(lobObject, 0, data);
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['clob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(data.length);

              expect(response.data).to.equal(data);

              expect(Buffer.byteLength(response.data))
                  .to.equal(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              return client.close();
            });
      });

      it('should succeed to write a new Russian Unicode CLOB using lobWrite()', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        let data = '';

        for (let i = 0; i < client._LOB_MAX_IO_LENGTH; ++i) {
          // These are 2-byte characters.
          data += 'Щ';
        }

        // Ensure the data is bigger than the `client._LOB_MAX_IO_LENGTH`.
        data += 'подъезд';

        let maxBytes = Buffer.byteLength(data);

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, /* initial size */0, tempLOBFileLocatorRE);

              return client.lobWrite(lobObject, 0, data);
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['clob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(data.length);

              expect(response.data).to.equal(data);

              expect(Buffer.byteLength(response.data))
                  .to.equal(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              return client.close();
            });
      });

      it('should succeed to write a new Chinese Unicode CLOB using lobWrite()', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        let data = '';

        for (let i = 0; i < client._LOB_MAX_IO_LENGTH; ++i) {
          // These are 3-byte characters.
          data += '梯';
        }

        // Ensure the data is bigger than the `client._LOB_MAX_IO_LENGTH`.
        data += '电梯';

        let maxBytes = Buffer.byteLength(data);

        return client
            .batchExecuteNoQuery(queries)
            .then(() => {
              return client.lobNew(CAS.CUBRIDDataType.CCI_U_TYPE_CLOB);
            })
            .then(lobObject => {
              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, /* initial size */0, tempLOBFileLocatorRE);

              return client.lobWrite(lobObject, 0, data);
            })
            .then(response => {
              validateLOBObject(response.lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB,
                  /* all bytes should be written */maxBytes, tempLOBFileLocatorRE);

              expect(response)
                  .to.have.property('length')
                  .to.equal(maxBytes);

              const params = [response.lobObject];
              const types = ['clob'];

              return client.executeWithTypedParams(`INSERT INTO ${TABLE_NAME} VALUES(1, ?)`, params, types);
            })
            .then(() => {
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

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(1);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const columns = result.ColumnValues[0];

              expect(columns)
                  .to.be.an('array')
                  .with.length(2);

              expect(columns[0])
                  .to.be.a('number')
                  .to.equal(1);

              const lobObject = columns[1];

              validateLOBObject(lobObject, CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, maxBytes);

              return client.lobRead(lobObject, 0, lobObject.lobLength);
            })
            .then(response => {
              expect(response)
                  .to.be.an('object')
                  .to.have.property('data')
                  .to.be.a('string')
                  .with.length(data.length);

              expect(response.data).to.equal(data);

              expect(Buffer.byteLength(response.data))
                  .to.equal(maxBytes);

              expect(response)
                  .to.have.property('length')
                  .to.be.a('number')
                  .to.equal(maxBytes);

              return client.close();
            });
      });
    });
  });
});
