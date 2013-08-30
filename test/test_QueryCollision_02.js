var path = require('path'),
		Util = require('util');

exports[path.basename(__filename)] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			EventEmitter = require('events').EventEmitter,
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

	test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  var getSingleValue = function (sql, client) {
    this.sql = sql;
	  this.client = client;

	  EventEmitter.call(this);
  };

	Util.inherits(getSingleValue, EventEmitter);

	getSingleValue.prototype.run = function () {
		var self = this;

		this.client.query(this.sql, function (err, result, queryHandle) {
			if (err) {
				self.emit('error', err);
			} else {
				self.client.closeQuery(queryHandle, function (err) {
					if (err) {
						self.emit('error', err);
					} else {
						self.emit('done', Result2Array.RowsArray(result)[0][0]);
					}
				});
			}
		});
	};

  var getMyValue = new getSingleValue('select count(*) from game', client);

  getMyValue.on('error', function (err) {
    Helpers.logInfo(err.message);
    throw err;
  });

  getMyValue.on('done', function (result) {
	  test.ok(result === 8653);

	  Helpers.logInfo('Test 1 passed.');
  });

  var getMyValue2 = new getSingleValue('select wrong_count(*) from game', client);

  getMyValue2.on('error', function (err) {
	  if (client.getEngineVersion().startsWith('8.4')) {
		  test.ok(err.message === "-493:Syntax: syntax error, unexpected '*' ");
	  } else {
		  test.ok(err.message === "-493:Syntax: In line 1, column 20 before ') from game'\nSyntax error: unexpected '*', expecting SELECT or VALUE or VALUES or '(' ");
	  }

    Helpers.logInfo('Test 2 passed.');

	  client.close(function () {
      test.done();
	  });
  });

	getMyValue.run();
	getMyValue2.run();
};
