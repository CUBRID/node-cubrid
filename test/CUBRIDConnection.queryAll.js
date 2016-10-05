'use strict';

const expect = require('chai').expect;
const testSetup = require('./testSetup');

describe('CUBRIDConnection', function () {
  describe('queryAll', function () {
    function validateFetchResults(result) {
      expect(result)
          .to.be.an('object')
          .to.not.have.property('queryHandle');

      const TOTAL_ROWS = 8653;

      expect(result)
          .to.have.property('RowsCount')
          .to.be.a('number')
          .to.equal(TOTAL_ROWS);

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
          .with.length(TOTAL_ROWS);

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
            .to.equal(1988);

        expect(columns[1])
            .to.be.a('number')
            .to.equal(20084);

        expect(columns[2])
            .to.be.a('number')
            .to.equal(16631);

        expect(columns[3])
            .to.be.a('number')
            .to.equal(30060);

        expect(columns[4])
            .to.be.a('string')
            .to.equal('AUS');

        expect(columns[5])
            .to.be.a('string')
            .to.equal('S');

        expect(columns[6])
            .to.be.an.instanceOf(Date)
            .to.deep.equal(new Date('1988-09-20T10:00:00+1000'));

        return true;
      });
    }

    this.timeout(4000);

    describe('when using the new protocol', function () {
      it('should succeed to execute queryAll(sql)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .queryAll('SELECT * FROM game')
            .then(result => {
              validateFetchResults(result);

              // The query should be closed automatically.
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to execute queryAll(sql, callback)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        return new Promise((resolve, reject) => {
          client.queryAll('SELECT * FROM game', function (err, result) {
            if (err) {
              return reject(err);
            }

            resolve(result);
          })
        })
            .then(result => {
              validateFetchResults(result);

              // The query should be closed automatically.
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });
    });

    describe('when using the old protocol', function () {
      it('should succeed to execute queryAll(sql)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return client
            .queryAll('SELECT * FROM game')
            .then(result => {
              validateFetchResults(result);

              // The query should be closed automatically.
              expect(client)
                  .to.be.an('object')
                  .to.have.property('_queryResultSets')
                  .to.be.an('object')
                  .to.be.empty;

              return client.close();
            });
      });

      it('should succeed to execute queryAll(sql, callback)', function () {
        let client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.setEnforceOldQueryProtocol(true);

        return new Promise((resolve, reject) => {
          client.queryAll('SELECT * FROM game', function (err, result) {
            if (err) {
              return reject(err);
            }

            resolve(result);
          })
        })
            .then(result => {
              validateFetchResults(result);

              // The query should be closed automatically.
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
