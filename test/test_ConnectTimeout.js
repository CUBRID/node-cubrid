var path = require('path');

exports[path.basename(__filename)] = function (test) {
	var CUBRID = require('../'),
			host = 'www.google.com'
			ErrorMessages = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/ErrorMessages'),
			client = new CUBRID.createCUBRIDConnection(host);

	test.expect(3);

  client.setConnectionTimeout(2000);

  client.connect(function (err) {
    if (err) {
      test.equal(err.message, ErrorMessages.ERROR_CONNECTION_TIMEOUT);

	    client = new CUBRID.createConnection({
		    host: host,
		    connectionTimeout: 2000
	    });

	    client.connect(function (err) {
		    if (err) {
			    test.equal(err.message, ErrorMessages.ERROR_CONNECTION_TIMEOUT);

			    client = new CUBRID.createConnection(host, 33000, 'public', '', 'demodb', 0, 2000);

			    client.connect(function (err) {
				    if (err) {
					    test.equal(err.message, ErrorMessages.ERROR_CONNECTION_TIMEOUT);
					    test.done();
				    } else {
					    throw 'We should not get here!';
				    }
			    });
		    } else {
			    throw 'We should not get here!';
		    }
	    });
    } else {
      throw 'We should not get here!';
    }
  });
};
