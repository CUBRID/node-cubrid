var Cache = require('../../Cache');

exports['test_Cache'] = function (test) {
  test.expect(9);
  console.log('Unit test ' + module.filename.toString() + ' started...');

  var cache = new Cache();

  cache.getSet(1, '1');
  cache.getSet(2, '22');
  cache.getSet(3, '333');

  test.equal(cache.contains(1), true);
  test.equal(cache.contains(2), true);
  test.equal(cache.contains(3), true);
  test.equal(cache.get(1), '1');
  test.equal(cache.get(2), '22');
  test.equal(cache.get(3), '333');
  test.equal(cache.contains(9), false);

  cache.clear();

  test.equal(cache.contains(1), false);

  var cache2 = new Cache(3);

  cache2.getSet(1, '1');

  setTimeout(function () {
      test.equal(cache2.contains(1), false);
      console.log('Unit test ended OK.');
      test.done();
    },
    4000
  );
};
