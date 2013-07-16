var path = require('path');

exports[path.basename(__dirname)] = function (test) {
	var client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection();

	test.expect(2);

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      client.query('SELECT * FROM nation', function (err, result, queryHandle) {
        if (err) {
	        throw err;
        } else {
          var foundQueryHandle = false;

          for (var i = client._queriesPacketList.length - 1; i > -1; --i) {
            if (client._queriesPacketList[i].queryHandle === queryHandle) {
              foundQueryHandle = true;
              break;
            }
          }

          test.ok(foundQueryHandle === true);

          client.end(function (err) {
            if (err) {
	            throw err;
            } else {
              foundQueryHandle = false;

              for (var i = client._queriesPacketList.length - 1; i > -1; --i) {
                if (client._queriesPacketList[i].handle === queryHandle) {
                  foundQueryHandle = true;
                  break;
                }
              }

              test.ok(foundQueryHandle === false);

              test.done();
            }
          });
        }
      });
    }
  });
};
