function NoopLogger() {

}

function noop() {}

NoopLogger.prototype.error = noop;
NoopLogger.prototype.info = noop;
NoopLogger.prototype.warn = noop;
NoopLogger.prototype.debug = noop;

module.exports = NoopLogger;
