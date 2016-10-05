'use strict';

const expect = require('chai').expect;
const CUBRID = require('../');
const ErrorMessages = require('../src/constants/ErrorMessages');
const testSetup = require('./testSetup');
const config = testSetup.config;

describe('CUBRIDConnection', function () {
  describe('connect', function () {
    describe('to a non-existing database', function () {
      const nonExistingDatabase = 'demodb_xyz';

      let nonExistingDatabaseError = new Error(`Failed to connect to database server, '${nonExistingDatabase}', on the following host(s): localhost:localhost`);
      let nonExistingDatabaseErrorShort = new Error(`Failed to connect to database server, '${nonExistingDatabase}', on the following host(s): localhost`);
      nonExistingDatabaseError.code = -677;

      // const errors = [
      //   // This is the correct message, CUBRID should return when a database is not found.
      //   "-677:Failed to connect to database server, 'demodb_xyz', on the following host(s): localhost:localhost",
      //   // When CUBRID is installed and started as a root, the following error is returned.
      //   // This may be a CUBRID bug or a spec. Need to keep these until we figure out
      //   // whether this is a bug or not.
      //   '-985:The hostname on the database connection string should be specified when multihost is set in "databases.txt".',
      //   // On CUBRID 9.1 and 8.4.1 the following error is returned.
      //   "-985:No error message available."];

      it('should fail to connect to a non-existing database using a callback', function (done) {
        const client = CUBRID.createConnection(config.hosts, config.port, config.user, config.password, nonExistingDatabase, 0, config.maxConnectionRetryCount, config.logger);

        client.connect(function (err) {
          if (err) {
            expect(err).to.be.an.instanceOf(Error);
            // Error `-191` is `ER_NET_CANT_CONNECT_SERVER`
            // Error `-677` is `ER_BO_CONNECT_FAILED`
            // https://github.com/CUBRID/cubrid/blob/2b45b718bb50abef0ede89f3920b3501b7302ca3/src/base/error_code.h
            expect([-191, -677]).to.include(err.code);

            if (err.code === -191) {
              expect(err.message).to.equal(nonExistingDatabaseErrorShort.message);
            } else {
              expect(err.message).to.equal(nonExistingDatabaseError.message);
            }

            return done();
          }

          done(new Error('The connection should have failed to a non-existing database.'));
        });
      });

      it('should fail to connect to a non-existing database using a promise', function () {
        const client = CUBRID.createConnection(config.hosts, config.port, config.user, config.password, nonExistingDatabase, 0, config.maxConnectionRetryCount, config.logger);

        return client
            .connect()
            .then(() => {
              throw new Error('The connection should have failed to a non-existing database.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              // Error `-191` is `ER_NET_CANT_CONNECT_SERVER`
              // Error `-677` is `ER_BO_CONNECT_FAILED`
              // https://github.com/CUBRID/cubrid/blob/2b45b718bb50abef0ede89f3920b3501b7302ca3/src/base/error_code.h
              expect([-191, -677]).to.include(err.code);

              if (err.code === -191) {
                expect(err.message).to.equal(nonExistingDatabaseErrorShort.message);
              } else {
                expect(err.message).to.equal(nonExistingDatabaseError.message);
              }
            });
      });
    });

    describe('to a wrong port', function () {
      const port = 80;
      const connectionTimeout = 5000;

      this.timeout(connectionTimeout * 2);

      it('should fail to connect to an incorrect port using a callback', function (done) {
        const client = CUBRID.createConnection(config.hosts, port, config.user, config.password, config.database, connectionTimeout, config.maxConnectionRetryCount, config.maxConnectionRetryCount, config.logger);

        client.connect(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.contain('connect ECONNREFUSED');

          done();
        });
      });

      it('should fail to connect to an incorrect port using a promise', function () {
        const client = CUBRID.createConnection(config.hosts, port, config.user, config.password, config.database, connectionTimeout, config.maxConnectionRetryCount, config.logger);

        return client
            .connect()
            .then(() => {
              throw new Error('The connection should have failed.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.contain('connect ECONNREFUSED');
            });
      });
    });

    describe('to a wrong host', function () {
      const host = '80.80.80.80';
      const connectionTimeout = 5000;

      this.timeout(connectionTimeout * 2);

      it('should fail to connect to an incorrect port using a callback', function (done) {
        const client = CUBRID.createConnection(host, config.port, config.user, config.password, config.database, connectionTimeout, config.maxConnectionRetryCount, config.logger);

        client.connect(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal(`connect ECONNREFUSED ${host}:${config.port}`);

          done();
        });
      });

      it('should fail to connect to an incorrect port using a promise', function () {
        const client = CUBRID.createConnection(host, config.port, config.user, config.password, config.database, connectionTimeout, config.maxConnectionRetryCount, config.logger);

        return client
            .connect()
            .then(() => {
              throw new Error('The connection should have failed.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(`connect ECONNREFUSED ${host}:${config.port}`);
            });
      });

      it('should fail to connect to a valid but non-CUBRID host within 1.5 seconds', function () {
        const client = new CUBRID.createConnection('www.google.com');
        const newTimeoutValue = 1500;

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

    describe('when a username is invalid', function () {
      const username = 'unknown_user';
      const connectionTimeout = 5000;
      const errors = [`User "${username}" is invalid.`, 'Your transaction has been aborted by the system due to server failure or mode change.'];

      this.timeout(connectionTimeout * 3);

      it('should fail to connect(callback) when a username is invalid', function (done) {
        const client = CUBRID.createConnection(config.hosts, config.port, username, config.password, config.database, connectionTimeout, config.maxConnectionRetryCount, config.logger);

        client.connect(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.code).to.equal(-165);
          expect(errors).to.include(err.message);

          done();
        });
      });

      it('should fail to connect() when a username is invalid', function () {
        const client = CUBRID.createConnection(config.hosts, config.port, username, config.password, config.database, connectionTimeout, config.maxConnectionRetryCount, config.logger);

        return client
            .connect()
            .then(() => {
              throw new Error('The connection should have failed.');
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.code).to.equal(-165);
              expect(errors).to.include(err.message);
            });
      });
    });

    describe('to a valid server', function () {
      it('should succeed to connect to a valid server using a callback', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.connect(function (err) {
          if (err) {
            return done(err);
          }

          client.close(done);
        });
      });

      it('should succeed to connect to a valid server using a promise', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .connect()
            .then(() => {
              return client.close();
            });
      });

      it('should fail to call connect() second time if the first connection request is in progress, i.e. pending', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.connect();

        return client
            .connect()
            .then(() => {
              throw new Error('The second connection should have failed.')
            })
            .catch(err => {
              expect(err).to.be.an.instanceOf(Error);
              expect(err.message).to.equal(ErrorMessages.ERROR_CONNECTION_ALREADY_PENDING);

              return client.close();
            });
      });

      it('should fail to call connect() using a callback second time if the first connection request is in progress, i.e. pending', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        this.timeout(3000);

        client.connect();

        client.connect(function (err) {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal(ErrorMessages.ERROR_CONNECTION_ALREADY_PENDING);

          client.close(done);
        });
      });

      it('should succeed to call connect() as a promise second time if the first connection request is completed, i.e. opened', function () {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        return client
            .connect()
            .then(() => {
              return client.connect();
            });
      });

      it('should succeed to call connect(callback) second time if the first connection request is completed, i.e. opened', function (done) {
        const client = testSetup.createDefaultCUBRIDDemodbConnection();

        client.connect(function (err) {
          if (err) {
            return done(err);
          }

          client.connect(done);
        });
      });
    });
  });
});
