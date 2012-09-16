var client = require('../../index.js').createDefaultCUBRIDDemodbConnection();
var Result2Array = require('../../src/resultset/Result2Array');

exports.setup = function (callback) {
  var empNames = [
    'John Doe',
    'Don Mae',
    'Missy Glenn',
    'John Tank',
    'Alec Willson',
    'Donna Doe',
    'Dana Jo',
    'Darling Mo',
    'Master Danny',
    'Senior Dan',
    'Maia Moore',
    'Secret Agent',
    'Dancing Queen',
    'Funny Guy',
    'Daniel Thor',
    'Doctor King',
    'Super Man',
    'Major John Ark',
    'Smiley Man',
    'Bud Thommas',
    'Ala Viking',
    'Beauty Beast',
    'Eleanor Karat'
  ];

  var sqls = new Array();
  sqls.push('drop table if exists employees');
  sqls.push('create table employees( \
    id int not null auto_increment, \
    f_name varchar(40) not null, \
    salary int not null, \
    primary key (id))');
  for (var i = 0; i < empNames.length; i++) {
    sqls.push("insert into employees(f_name,salary) values('" + empNames[i] + "'," + Math.random() * 10000 + ")");
  }
  console.log(sqls);

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      console.log('Connected.');
      console.log('Setup employees...');
      client.batchExecuteNoQuery(sqls, function (err) {
        if (err) {
          throw err;
        } else {
          client.close(function (err) {
            if (err) {
              throw err;
            } else {
              console.log('Connection closed.');
              callback();
            }
          });
        }
      });
    }
  });
};

exports.add_employee = function (data, callback) {
  var sql = "insert into employees (f_name, salary) values ('" + data.name + "'," + data.salary + ")";
  console.log(sql);

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
              callback();
            }
          });
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
              callback();
            }
          });
        }
      });
    }
  });
};

exports.update_employee = function (data, callback) {
  var sql = "update employees set f_name='" + data.name + "', salary=" + data.salary + " where id=" + data.id;
  console.log(sql);

  client.connect(function (err) {
    if (err) {
      throw err;
    } else {
      console.log('Connected.');
      console.log('Updating employee: ' + data.toString());
      client.batchExecuteNoQuery(sql, function (err) {
        if (err) {
          throw err;
        } else {
          client.close(function (err) {
            if (err) {
              throw err;
            } else {
              console.log('Connection closed.');
              callback();
            }
          });
        }
      });
    }
  });
};

exports.get_employees = function (startFrom, selectCount, callback) {
  var sql = "select * from employees where rownum between " + startFrom + " and " + (startFrom + selectCount - 1);
  console.log(sql);

  var data = null;
  var cols = null;
  var totalRows = 0;

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
          data = Result2Array.RowsArray(result);
          cols = Result2Array.ColumnNamesArray(result);
          client.closeQuery(queryHandle, function (err) {
            if (err) {
              console.log(err.message);
            } else {
              console.log('Query closed.');
              var sqlCount = "select count(*) from employees";
              console.log(sqlCount);
              client.query(sqlCount, function (err, result, queryHandle) {
                if (err) {
                  throw err;
                } else {
                  totalRows = Result2Array.RowsArray(result)[0][0];
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
                          callback(data, cols, totalRows);
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

