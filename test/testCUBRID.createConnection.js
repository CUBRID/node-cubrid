var path = require('path');

exports[path.basename(__dirname)] = function (test) {
	var CUBRID = require('../'),
			config = require('./testSetup/test_Setup').config,
			client = new CUBRID.createConnection(config.host, config.port, config.user, config.password, config.database);

	test.expect(0);

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
							test.done();
						}
					});
				}
			});
		}
	});
};
