var path = require('path');

exports[path.basename(__dirname)] = function (test) {
	var CUBRID = require('../'),
			ErrorMessages = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/ErrorMessages'),
			client = new CUBRID.createCUBRIDConnection('www.google.com', 33000, 'public', '', 'demodb');

	test.expect(7);

	client.setConnectionTimeout(2000);
	test.equal(client.getConnectionTimeout(), 2000, 'Setting timeout value bigger than 0, should set it to that value.');

	client.setConnectionTimeout(0);
	test.equal(client.getConnectionTimeout(), 0, 'Setting timeout value to 0, should set it to 0.');

	client.setConnectionTimeout(-3000);
	test.equal(client.getConnectionTimeout(), 0, 'Setting timeout value to less than 0, should set it to 0.');

	client.setConnectionTimeout(2000);
	test.equal(client.getConnectionTimeout(), 2000);

	client.setConnectionTimeout(2000);
	test.equal(client.getConnectionTimeout(), 2000, 'Setting the same timeout value again and again should be successful.');

	client.connect(function (err) {
		if (err) {
			test.equal(err.message, ErrorMessages.ERROR_CONNECTION_TIMEOUT);
			test.ok(client.connectionOpened === false);

			test.done();
		} else {
			throw 'We should not get here!';
		}
	});
};
