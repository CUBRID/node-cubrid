const Helpers = require('../utils/Helpers');

module.exports = Query;

function Query(sql, params, cb) {
  if (typeof sql === 'function') {
    cb = sql;
  } else if (typeof params === 'function' || Array.isArray(sql)) {
    this.sql = sql;
    cb = params;
  } else if (typeof sql === 'string') {
    this.sql = Helpers._sqlFormat(sql, params);
  }

  this.callback = cb;
}
