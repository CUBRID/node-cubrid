var path = require('path');

exports[path.basename(__filename)] = function (test) {
	var CUBRID = require('../'),
			config = require('./testSetup/test_Setup').config,
			connectionCount = 4,
			closedCount = 0;

	test.expect(0);

	function connect(client) {
		client.connect(function (err) {
			if (err) {
				throw err;
			} else {
				client.getEngineVersion(function (err) {
					if (err) {
						throw err;
					} else {
						client.close(function (err) {
							if (err) {
								throw err;
							} else {
								if (++closedCount == connectionCount) {
									test.done();
								}
							}
						});
					}
				});
			}
		});
	}

	// Create a connection by passing a list of parameters.
	connect(new CUBRID.createCUBRIDConnection(config.host, config.port, config.user, config.password, config.database));
	// Create a connection by passing a object of parameters.
	connect(new CUBRID.createCUBRIDConnection({
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database
	}));

	// Now test the alias function.
	// Create a connection by passing a list of parameters.
	connect(new CUBRID.createConnection(config.host, config.port, config.user, config.password, config.database));
	// Create a connection by passing a object of parameters.
	connect(new CUBRID.createConnection({
		host: config.host,
		port: config.port,
		user: config.user,
		password: config.password,
		database: config.database
	}));
};
