var events = require('events'),
		CUBRID = require('../../'),
		Helpers = CUBRID.Helpers,
		testing;

var Test = function (err) {
  this.err = err;

  this.EVENT_ERROR = 'error';
  this.EVENT_SUCCESS = 'success';
};

Test.prototype = new events.EventEmitter;

Test.prototype.increment = function () {
  var self = this;

  Helpers._emitEvent(self, self.err, this.EVENT_ERROR, this.EVENT_SUCCESS, 'Success event');
};

var test1 = new Test(null);
var test2 = new Test(new Error('Error!'));

test2.on(test2.EVENT_ERROR, function (err) {
  testing.equal(err.message, 'Error!');
});

test1.on(test1.EVENT_SUCCESS, function (messaje) {
  testing.equal(messaje, 'Success event');
});

exports['test_EmitEvent'] = function (test) {
  test.expect(2);
  testing = test;
  Helpers.logInfo('Unit test ' + module.filename.toString() + ' started...');
  test1.increment();
  test2.increment();

  Helpers.logInfo('Unit test ended OK.');
  test.done();
};

