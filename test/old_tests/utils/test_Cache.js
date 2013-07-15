var assert = require('assert'),
  Cache = require('../Cache');

console.log('Unit test ' + module.filename.toString() + ' started...');

var cache = new Cache();

cache.getSet(1, '1');
cache.getSet(2, '22');
cache.getSet(3, '333');

assert.equal(cache.contains(1), true);
assert.equal(cache.contains(2), true);
assert.equal(cache.contains(3), true);
assert.equal(cache.get(1), '1');
assert.equal(cache.get(2), '22');
assert.equal(cache.get(3), '333');
assert.equal(cache.contains(9), false);

cache.clear();

assert.equal(cache.contains(1), false);

var cache2 = new Cache(3);

cache2.getSet(1, '1');

setTimeout(function () {
    assert.equal(cache2.contains(1), false);
    console.log('Unit test ended OK.');
  },
  4000
);



