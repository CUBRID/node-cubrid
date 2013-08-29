var Helpers = require('../utils/Helpers');

module.exports = Query;

function noOp() {}

function Query(sql, params, cb) {
	if (!params || typeof params === 'function') {
		this.sql = sql;
		cb = cb || params;
	} else {
		this.sql = Helpers._sqlFormat(sql, params);
	}

	this.callback = cb || noOp;
}
