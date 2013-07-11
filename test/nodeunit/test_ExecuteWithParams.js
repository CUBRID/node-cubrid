var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
  Helpers = require('../../src/utils/Helpers'),
  assert = require('assert');

var sqlDrop = 'drop table if exists ?';
var sqlCreate = 'create table ?(id int)';
var sqlInsert = 'insert into ? values(1)';
var arrValues = ['node_test'];

function errorHandler(err) {
  throw err.message;
}
exports['test_ExecuteWithParams'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      CUBRIDClient.executeWithParams(sqlDrop, arrValues, ['"'], function (err) {
        if (err) {
          errorHandler(err);
        } else {
          CUBRIDClient.executeWithParams(sqlCreate, arrValues, ['"'], function (err) {
            if (err) {
              errorHandler(err);
            } else {
              CUBRIDClient.executeWithParams(sqlInsert, arrValues, ['"'], function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  CUBRIDClient.executeWithParams(sqlDrop, arrValues, ['"'], function (err) {
                    if (err) {
                      errorHandler(err);
                    } else {
                      CUBRIDClient.close(function (err) {
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
