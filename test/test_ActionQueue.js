exports['test_ActionQueue'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			ActionQueue = require('../src' + codeCoveragePath + '/utils/ActionQueue'),
			count = 0,
			startTime = (new Date()).getTime();

	test.expect(2);

	ActionQueue.enqueue(
			[
				function (callback) {
					callback(null, '1');
				},
				function (data, callback) {
					setTimeout(function () {
						callback(null, data + ',2');
					}, 3000);
				},
				function (data, callback) {
					setTimeout(function () {
						callback(null, data + ',3');
					}, 1000);
				},
				function (data, callback) {
					callback(null, data + ',4');
				}
			],
			function (err, results) {
				test.equal(results, '1,2,3,4');
			}
	);

	ActionQueue.while(
			function () {
				return count < 5;
			},
			function (callback) {
				count++;
				setTimeout(callback, 1000);
			},
			function (err) {
				if (err) {
					throw err.toString();
				} else {
					var endTime = (new Date()).getTime();
					// 5 seconds have passed?
					test.ok(endTime - startTime > 5 * 1000);
					test.done();
				}
			}
	);
};
