'use strict';

const expect = require('chai').expect;
const CUBRID = require('../');
const testSetup = require('./testSetup');

describe('CUBRID', function () {
	describe('createConnection', function () {
    it('should succeed to create and close several client connections', function (done) {
      const config = testSetup.config;
      let closedCount = 0;

      // Create a connection by passing a list of parameters.
      const client1 = new CUBRID.createCUBRIDConnection(config.hosts, config.port, config.user, config.password, config.database);

      // Create a connection by passing an object of parameters.
      const client2 = new CUBRID.createCUBRIDConnection({
        host: config.hosts,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
      });

      // Now test the alias function.
      // Create a connection by passing a list of parameters.
      const client3 = new CUBRID.createConnection(config.hosts, config.port, config.user, config.password, config.database);

      // Create a connection by passing an object of parameters.
      const client4 = new CUBRID.createConnection({
        hosts: config.hosts,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
      });

      // Default `host`, `port`, `user`, `password`, and `database`
      // values should be used when not provided.
      const client5 = new CUBRID.createConnection();

      // Create a connection by passing an object of parameters.
      const client6 = new CUBRID.createConnection({
        hosts: config.hosts,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionTimeout: 2000,
        maxConnectionRetryCount: 2,
      });

      // Ensure the options reached the client.
      expect(client6)
          .to.have.property('connectionTimeout')
          .to.equal(2000);

      expect(client6)
          .to.have.property('maxConnectionRetryCount')
          .to.equal(2);

      expect(client6)
          .to.have.property('hosts')
          .to.be.an('array')
          .with.length(1);

      const clients = [client1, client2, client3, client4, client5, client6];

      let promise = Promise.resolve();

      clients.forEach(client => {
        promise = promise.then(() => {
          return client
              .connect()
              .then(() => {
                return client.getEngineVersion();
              })
              .then(() => {
                return client.close();
              })
              .then(() => {
                ++closedCount;
              });
        });
      });

      promise
          .then(() => {
            expect(closedCount).to.equal(clients.length);

            done();
          })
          .catch(done);
    });

    it('should auto connect to the second host when the first host is down', function () {
      const config = testSetup.config;

      const client = new CUBRID.createConnection({
        hosts: ['80.80.80.80'].concat(config.hosts),
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        connectionTimeout: 2000,
        maxConnectionRetryCount: 2,
      });

      // Ensure the options reached the client.
      expect(client)
          .to.have.property('connectionTimeout')
          .to.equal(2000);

      expect(client)
          .to.have.property('maxConnectionRetryCount')
          .to.equal(2);

      expect(client)
          .to.have.property('hosts')
          .to.be.an('array')
          .with.length(2);

      return client
          .connect()
          .then(() => {
            return client.getActiveHost();
          })
          .then(host => {
            expect(host)
                .to.be.an('object')
                .to.have.property('host')
                .to.be.a('string')
                .to.equal(config.hosts[0]);

            expect(host)
                .to.have.property('port')
                .to.be.a('number')
                .to.equal(config.port);

            return client.close();
          });
    });
  });
});
