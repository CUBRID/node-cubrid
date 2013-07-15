exports['test_ExecuteWithParams'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			assert = require('assert'),
			sqlDrop = 'drop table if exists ?',
			sqlCreate = 'create table ?(id int)',
			sqlInsert = 'insert into ? values(1)',
			arrValues = ['node_test'];

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      client.executeWithParams(sqlDrop, arrValues, ['"'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          client.executeWithParams(sqlCreate, arrValues, ['"'], function (err) {
            if (err) {
              errorHandler(err);
            } else {
              client.executeWithParams(sqlInsert, arrValues, ['"'], function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  client.executeWithParams(sqlDrop, arrValues, ['"'], function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      client.close(function (err) {
                        if (err) {
                          errorHandler(err);
                        } else {
                          Helpers.logInfo('Connection closed.');
                          Helpers.logInfo('Test passed.');
                          test.done();
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};
