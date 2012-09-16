var Helpers = require('./Helpers');

/**
 * Code adapted from MicroCache library:
 * https://github.com/jeromeetienne/microcache.js
 * License: https://github.com/jeromeetienne/MicroCache.js/blob/master/MIT-LICENSE.txt
 */

var Cache = function (expireAfterSeconds) {
  var _values = {};
  var createdTime = (new Date()).getTime();

  var _expire = function () {
    if (typeof expireAfterSeconds != 'undefined' && expireAfterSeconds > 0) {
      if ((new Date()).getTime() - createdTime >= expireAfterSeconds * 1000) {
        _values = {};
        createdTime = (new Date()).getTime();
      }
    }
  };

  return {
    get      : function (key) {
      _expire();
      return _values[key];
    },
    _set     : function (key, value) {
      _expire();
      _values[key] = value;
    },
    contains : function (key) {
      _expire();
      return key in _values;
    },
    /**
     * Get a value from cache; if the value is not found, then add it to the cache
     */
    getSet   : function (key, value) {
      _expire();
      if (!this.contains(key)) {
        this._set(key, value)
      } else {
        Helpers.logInfo('Value found in cache.');
      }
      return this.get(key);
    },
    /**
     * Clear all values in cache
     */
    clear    : function () {
      _values = {};
    }
  }
};

if (typeof module != 'undefined' && ('exports' in module)) {
  module.exports = Cache;
}


