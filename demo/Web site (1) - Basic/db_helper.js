var client = require('../../index.js').createDefaultCUBRIDDemodbConnection();
var Result2Array = require('../../src/resultset/Result2Array');

exports.add_employee = function (data, callback) {
  var sql = "insert into employees (f_name, salary) values ('" + data.name + "'," + data.salary + ")";

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      console.log('Connected.');
      console.log('Adding employee: ' + data.name + ' with salary: ' + data.salary);
      client.batchExecuteNoQuery(sql, function (err) {
        if (err) {
          throw err;
        } else {
          client.close(function (err) {
            if (err) {
              throw err;
            } else {
              console.log('Connection closed.');
            }
          });

          callback();
        }
      });
    }
  });
};

exports.delete_employee = function (data, callback) {
  var sql = "delete from employees where id in (" + data.toString() + ")";

  console.log(sql);

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      console.log('Connected.');
      console.log('Deleting employees: ' + data.toString());
      client.batchExecuteNoQuery(sql, function (err) {
        if (err) {
          throw err;
        } else {
          client.close(function (err) {
            if (err) {
              throw err;
            } else {
              console.log('Connection closed.');
            }
          });

          callback();
        }
      });
    }
  });
};

exports.get_employees = function (callback) {
  var sql = "select * from employees order by id asc";

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      console.log('Connected.');
      console.log('Querying: ' + sql);
      client.query(sql, function (err, result, queryHandle) {
        if (err) {
          throw err;
        } else {
          client.closeQuery(queryHandle, function (err) {
            if (err) {
              console.log(err.message);
            } else {
              console.log('Query closed.');
              client.close(function (err) {
                if (err) {
                  throw err;
                } else {
                  console.log('Connection closed.');
                }
              });
            }
          });

          var emp = Result2Array.RowsArray(result);
          var cols = Result2Array.ColumnNamesArray(result);
          var cnt = Result2Array.TotalRowsCount(result);
          // Callback function returns employees array
          callback(emp, cols, cnt);
        }
      });
    }
  });
};

