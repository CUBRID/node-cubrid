var path = require('path');

exports[path.basename(__dirname)] = function (test) {
	var CUBRID = require('../'),
			client = new CUBRID.createCUBRIDConnection('www.google.com', 33000, 'public', '', 'demodb');

	test.expect(2);

	test.equal(client.getConnectionTimeout(), 0, 'Initial connection timeout should be 0.');

	client.setConnectionTimeout(2000);
	test.equal(client.getConnectionTimeout(), 2000);

	test.done();
};
