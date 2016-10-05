'use strict';

/*
* curl -O http://10.99.214.76:8990/perf-results-cubrid-9.2.3.0005-node-v4.5.0-node-cubrid-3.0.0-Wed-Sep-28-2016-19-42-38-GMT+0900--KST-.csv
*
* CUBRID_VERSION=9.2.3.0005 node memory-leak-check.js
* */

const fs = require('fs');
const path = require('path');

if (!process.env.CUBRID_VERSION) {
  console.error('"CUBRID_VERSION" environment variable must be defined to proceed.');
  process.exit(1);
}

const CUBRID = require('../../');
const version = require('../../package.json').version;
const date = (new Date).toString().replace(/[\s:\(\))]/g, '-');

const fd = fs.openSync(path.join(__dirname,
    `perf-results-cubrid-${process.env.CUBRID_VERSION}-node-${process.version}-node-cubrid-${version}-${date}.csv`
), 'a');

const config = {
  host: '10.99.214.76',
  port: 33000,
  user: 'public',
  password: '',
  database: 'demodb',
};

const client = new CUBRID.createCUBRIDConnection(config);
const testTime = 5 * 60 * 1000;
let counter = 0;
let lastCounter = 0;
let stop = false;

function query(cb) {
  if (stop) {
    return cb();
  }

  process.stdout.write(`${++counter}\r`);

  client.query('SELECT * FROM game LIMIT 100', function (err, result, queryHandle) {
    if (err) {
      return cb(err);
    }

    client.closeQuery(queryHandle, function (err) {
      if (err) {
        return cb(err);
      }

      query(cb);
    });
  });
}

const timer = setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const QPS = counter - lastCounter;

  lastCounter = counter;

  fs.write(fd, `${Date.now()},${QPS},${memoryUsage.rss},${memoryUsage.heapTotal},${memoryUsage.heapUsed}\r\n`, function () {});
}, 1000);

setTimeout(function () {
  stop = true;
}, testTime);

query(function (err) {
  if (err) {
    throw err;
  }

  clearInterval(timer);

  fs.closeSync(fd);

  client.close();
});
