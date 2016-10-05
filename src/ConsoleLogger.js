/* eslint-env node */

function ConsoleLogger() {

}

ConsoleLogger.prototype.error = function () {
  /* eslint-disable no-console */
  console.error.apply(console, arguments);
  /* eslint-enable no-console */
};

ConsoleLogger.prototype.info = function () {
  /* eslint-disable no-console */
  console.error.apply(console, arguments);
  /* eslint-enable no-console */
};

ConsoleLogger.prototype.warn = function () {
  /* eslint-disable no-console */
  console.warn.apply(console, arguments);
  /* eslint-enable no-console */
};

ConsoleLogger.prototype.debug = function () {
  /* eslint-disable no-console */
  console.log.apply(console, arguments);
  /* eslint-enable no-console */
};

module.exports = ConsoleLogger;
