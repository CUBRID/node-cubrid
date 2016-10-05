'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');
const ErrorMessages = require('../src/constants/ErrorMessages');

describe('CUBRIDConnection', function () {
  describe('fetch', function () {
    describe('when using the new protocol', function () {
      // The new protocol returns less records than when using the old protocol.
      let fetchedRecordsCount = 235;

      it('should succeed to execute fetch(queryHandle) after query(sql)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        this.timeout(4000);

        return client
            .query('SELECT * FROM game')
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
              const TOTAL_ROWS = 8653;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(TOTAL_ROWS);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const COLUMNS_COUNT = 7;
              const COLUMN_NAMES = ['host_year', 'event_code', 'athlete_code', 'stadium_code', 'nation_code', 'medal', 'game_date'];
              const COLUMN_TYPES = ['Int', 'Int', 'Int', 'Int', 'Char', 'Char', 'Date'];

              expect(result)
                  .to.have.property('ColumnNames')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnNames)
                  .to.deep.equal(COLUMN_NAMES);

              expect(result)
                  .to.have.property('ColumnDataTypes')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnDataTypes)
                  .to.deep.equal(COLUMN_TYPES);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(fetchedRecordsCount);

              // Validate the first row.
              expect(result.ColumnValues[0]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20021);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14345);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30116);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('NGR');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-28T09:00:00+0900'));

                return true;
              });

              // Validate the last row.
              expect(result.ColumnValues[result.ColumnValues.length - 1]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20317);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14457);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30124);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('ITA');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('G');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-26T09:00:00+0900'));

                return true;
              });

              // Now fetch the rest rows.
              function fetch(queryHandle) {
                return client
                    .fetch(queryHandle)
                    .then(response => {
                      expect(response)
                          .to.be.an('object')
                          .to.have.property('queryHandle')
                          .to.be.a('number')
                          .to.equal(queryHandle);

                      expect(response)
                          .to.have.property('result');

                      if (response.result) {
                        expect(response.result)
                            .to.be.an('object');

                        let result = response.result;

                        expect(result)
                            .to.be.an('object')
                            .to.not.have.property('RowsCount');

                        expect(client)
                            .to.be.an('object')
                            .to.have.property('_queryResultSets')
                            .to.be.an('object')
                            .to.have.all.keys(['' + response.queryHandle]);

                        expect(result)
                            .to.not.have.property('ColumnNames');

                        expect(result)
                            .to.not.have.property('ColumnDataTypes');

                        expect(result)
                            .to.have.property('ColumnValues')
                            .to.be.an('array')
                            .with.length.above(0);

                        return fetch(queryHandle);
                      } else {
                        expect(response.result)
                            .to.be.null;

                        return response;
                      }
                    });
              }

              return fetch(response.queryHandle);
            })
            .then(response => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;
            });
      });

      it('should succeed to execute fetch(queryHandle, callback) after query(sql)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        this.timeout(3000);

        return client
            .query('SELECT * FROM game')
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
              const TOTAL_ROWS = 8653;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(TOTAL_ROWS);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const COLUMNS_COUNT = 7;
              const COLUMN_NAMES = ['host_year', 'event_code', 'athlete_code', 'stadium_code', 'nation_code', 'medal', 'game_date'];
              const COLUMN_TYPES = ['Int', 'Int', 'Int', 'Int', 'Char', 'Char', 'Date'];

              expect(result)
                  .to.have.property('ColumnNames')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnNames)
                  .to.deep.equal(COLUMN_NAMES);

              expect(result)
                  .to.have.property('ColumnDataTypes')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnDataTypes)
                  .to.deep.equal(COLUMN_TYPES);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(fetchedRecordsCount);

              // Validate the first row.
              expect(result.ColumnValues[0]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20021);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14345);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30116);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('NGR');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-28T09:00:00+0900'));

                return true;
              });

              // Validate the last row.
              expect(result.ColumnValues[result.ColumnValues.length - 1]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20317);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14457);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30124);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('ITA');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('G');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-26T09:00:00+0900'));

                return true;
              });

              // Now fetch the rest rows.
              function fetch(queryHandle) {
                return new Promise((resolve, reject) => {
                  client.fetch(response.queryHandle, function (err, result, queryHandle) {
                    if (err) {
                      return reject(err);
                    }

                    resolve({
                      queryHandle,
                      result,
                    });
                  })
                })
                    .then(response => {
                      expect(response)
                          .to.be.an('object')
                          .to.have.property('queryHandle')
                          .to.be.a('number')
                          .to.equal(queryHandle);

                      expect(response)
                          .to.have.property('result');

                      if (response.result) {
                        expect(response.result)
                            .to.be.an('object');

                        let result = response.result;

                        expect(result)
                            .to.be.an('object')
                            .to.not.have.property('RowsCount');

                        expect(client)
                            .to.be.an('object')
                            .to.have.property('_queryResultSets')
                            .to.be.an('object')
                            .to.have.all.keys(['' + response.queryHandle]);

                        expect(result)
                            .to.not.have.property('ColumnNames');

                        expect(result)
                            .to.not.have.property('ColumnDataTypes');

                        expect(result)
                            .to.have.property('ColumnValues')
                            .to.be.an('array')
                            .with.length.above(0);

                        return fetch(queryHandle);
                      } else {
                        expect(response.result)
                            .to.be.null;

                        return response;
                      }
                    });
              }

              return fetch(response.queryHandle);
            })
            .then(response => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;
            });
      });
     
      it('should fail prematurely when fetch(queryHandle, callback) with an invalid queryHandle', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client.query('SELECT * FROM game')
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
              const TOTAL_ROWS = 8653;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(TOTAL_ROWS);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const COLUMNS_COUNT = 7;
              const COLUMN_NAMES = ['host_year', 'event_code', 'athlete_code', 'stadium_code', 'nation_code', 'medal', 'game_date'];
              const COLUMN_TYPES = ['Int', 'Int', 'Int', 'Int', 'Char', 'Char', 'Date'];

              expect(result)
                  .to.have.property('ColumnNames')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnNames)
                  .to.deep.equal(COLUMN_NAMES);

              expect(result)
                  .to.have.property('ColumnDataTypes')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnDataTypes)
                  .to.deep.equal(COLUMN_TYPES);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(fetchedRecordsCount);

              // Validate the first row.
              expect(result.ColumnValues[0]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20021);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14345);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30116);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('NGR');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-28T09:00:00+0900'));

                return true;
              });

              // Validate the last row.
              expect(result.ColumnValues[result.ColumnValues.length - 1]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20317);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14457);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30124);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('ITA');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('G');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-26T09:00:00+0900'));

                return true;
              });

              return new Promise((resolve, reject) => {
                client.fetch(-1234, function (err, result, queryHandle) {
                  if (err) {
                    return reject(err);
                  }

                  resolve({
                    queryHandle,
                    result,
                  });
                });
              });
            })
            .then(() => {
              throw new Error('fetch() should have failed when providing an invalid queryHandle');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_NO_ACTIVE_QUERY);
            });
      });

      it('should fail prematurely when fetch(queryHandle) with an invalid queryHandle', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client.query('SELECT * FROM game')
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
              const TOTAL_ROWS = 8653;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(TOTAL_ROWS);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const COLUMNS_COUNT = 7;
              const COLUMN_NAMES = ['host_year', 'event_code', 'athlete_code', 'stadium_code', 'nation_code', 'medal', 'game_date'];
              const COLUMN_TYPES = ['Int', 'Int', 'Int', 'Int', 'Char', 'Char', 'Date'];

              expect(result)
                  .to.have.property('ColumnNames')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnNames)
                  .to.deep.equal(COLUMN_NAMES);

              expect(result)
                  .to.have.property('ColumnDataTypes')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnDataTypes)
                  .to.deep.equal(COLUMN_TYPES);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(fetchedRecordsCount);

              // Validate the first row.
              expect(result.ColumnValues[0]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20021);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14345);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30116);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('NGR');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-28T09:00:00+0900'));

                return true;
              });

              // Validate the last row.
              expect(result.ColumnValues[result.ColumnValues.length - 1]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20317);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14457);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30124);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('ITA');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('G');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-26T09:00:00+0900'));

                return true;
              });

              return client.fetch(-1234);
            })
            .then(() => {
              throw new Error('fetch() should have failed when providing an invalid queryHandle');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_NO_ACTIVE_QUERY);
            });
      });
    });

    describe('when using the old protocol', function () {
      let fetchedRecordsCount = 241;

      it('should succeed to execute fetch(queryHandle) after query(sql)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        this.timeout(4000);

        return client
            .query('SELECT * FROM game')
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
              const TOTAL_ROWS = 8653;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(TOTAL_ROWS);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const COLUMNS_COUNT = 7;
              const COLUMN_NAMES = ['host_year', 'event_code', 'athlete_code', 'stadium_code', 'nation_code', 'medal', 'game_date'];
              const COLUMN_TYPES = ['Int', 'Int', 'Int', 'Int', 'Char', 'Char', 'Date'];

              expect(result)
                  .to.have.property('ColumnNames')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnNames)
                  .to.deep.equal(COLUMN_NAMES);

              expect(result)
                  .to.have.property('ColumnDataTypes')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnDataTypes)
                  .to.deep.equal(COLUMN_TYPES);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(fetchedRecordsCount);

              // Validate the first row.
              expect(result.ColumnValues[0]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20021);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14345);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30116);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('NGR');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-28T09:00:00+0900'));

                return true;
              });

              // Validate the last row.
              expect(result.ColumnValues[result.ColumnValues.length - 1]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20317);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(12906);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30124);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('USA');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-26T09:00:00+0900'));

                return true;
              });

              // Now fetch the rest rows.
              function fetch(queryHandle) {
                return client
                    .fetch(response.queryHandle)
                    .then(response => {
                      expect(response)
                          .to.be.an('object')
                          .to.have.property('queryHandle')
                          .to.be.a('number')
                          .to.equal(queryHandle);

                      expect(response)
                          .to.have.property('result');

                      if (response.result) {
                        expect(response.result)
                            .to.be.an('object');

                        let result = response.result;

                        expect(result)
                            .to.be.an('object')
                            .to.not.have.property('RowsCount');

                        expect(client)
                            .to.be.an('object')
                            .to.have.property('_queryResultSets')
                            .to.be.an('object')
                            .to.have.all.keys(['' + response.queryHandle]);

                        expect(result)
                            .to.not.have.property('ColumnNames');

                        expect(result)
                            .to.not.have.property('ColumnDataTypes');

                        expect(result)
                            .to.have.property('ColumnValues')
                            .to.be.an('array')
                            .with.length.above(0);

                        return fetch(queryHandle);
                      } else {
                        expect(response.result)
                            .to.be.null;

                        return response;
                      }
                    });
              }

              return fetch(response.queryHandle);
            })
            .then(response => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;
            });
      });

      it('should succeed to execute fetch(queryHandle, callback) after query(sql)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        this.timeout(4000);

        return client
            .query('SELECT * FROM game')
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
              const TOTAL_ROWS = 8653;

              expect(result)
                  .to.be.an('object')
                  .to.have.property('RowsCount')
                  .to.be.a('number')
                  .to.equal(TOTAL_ROWS);

              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              const COLUMNS_COUNT = 7;
              const COLUMN_NAMES = ['host_year', 'event_code', 'athlete_code', 'stadium_code', 'nation_code', 'medal', 'game_date'];
              const COLUMN_TYPES = ['Int', 'Int', 'Int', 'Int', 'Char', 'Char', 'Date'];

              expect(result)
                  .to.have.property('ColumnNames')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnNames)
                  .to.deep.equal(COLUMN_NAMES);

              expect(result)
                  .to.have.property('ColumnDataTypes')
                  .to.be.an('array')
                  .with.length(COLUMNS_COUNT);

              expect(result.ColumnDataTypes)
                  .to.deep.equal(COLUMN_TYPES);

              expect(result)
                  .to.have.property('ColumnValues')
                  .to.be.an('array')
                  .with.length(fetchedRecordsCount);

              // Validate the first row.
              expect(result.ColumnValues[0]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20021);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(14345);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30116);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('NGR');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-28T09:00:00+0900'));

                return true;
              });

              // Validate the last row.
              expect(result.ColumnValues[result.ColumnValues.length - 1]).to.satisfy(columns => {
                expect(columns)
                    .to.be.an('array')
                    .with.length(COLUMNS_COUNT);

                expect(columns[0])
                    .to.be.a('number')
                    .to.equal(2004);

                expect(columns[1])
                    .to.be.a('number')
                    .to.equal(20317);

                expect(columns[2])
                    .to.be.a('number')
                    .to.equal(12906);

                expect(columns[3])
                    .to.be.a('number')
                    .to.equal(30124);

                expect(columns[4])
                    .to.be.a('string')
                    .to.equal('USA');

                expect(columns[5])
                    .to.be.a('string')
                    .to.equal('B');

                expect(columns[6])
                    .to.be.an.instanceOf(Date)
                    .to.deep.equal(new Date('2004-08-26T09:00:00+0900'));

                return true;
              });

              // Now fetch the rest rows.
              function fetch(queryHandle) {
                return new Promise((resolve, reject) => {
                  client.fetch(response.queryHandle, function (err, result, queryHandle) {
                    if (err) {
                      return reject(err);
                    }

                    resolve({
                      queryHandle,
                      result,
                    });
                  })
                })
                    .then(response => {
                      expect(response)
                          .to.be.an('object')
                          .to.have.property('queryHandle')
                          .to.be.a('number')
                          .to.equal(queryHandle);

                      expect(response)
                          .to.have.property('result');

                      if (response.result) {
                        expect(response.result)
                            .to.be.an('object');

                        let result = response.result;

                        expect(result)
                            .to.be.an('object')
                            .to.not.have.property('RowsCount');

                        expect(client)
                            .to.be.an('object')
                            .to.have.property('_queryResultSets')
                            .to.be.an('object')
                            .to.have.all.keys(['' + response.queryHandle]);

                        expect(result)
                            .to.not.have.property('ColumnNames');

                        expect(result)
                            .to.not.have.property('ColumnDataTypes');

                        expect(result)
                            .to.have.property('ColumnValues')
                            .to.be.an('array')
                            .with.length.above(0);

                        return fetch(queryHandle);
                      } else {
                        expect(response.result)
                            .to.be.null;

                        return response;
                      }
                    });
              }

              return fetch(response.queryHandle);
            })
            .then(response => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.have.all.keys(['' + response.queryHandle]);

              return client.close();
            })
            .then(() => {
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;
            });
      });
    });
  });
});
