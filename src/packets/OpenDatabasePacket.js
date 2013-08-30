var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = OpenDatabasePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function OpenDatabasePacket(options) {
  options = options || {};

  this.database = options.database;
  this.user = options.user;
  this.password = options.password;
  this.casInfo = options.casInfo;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
OpenDatabasePacket.prototype.write = function (writer) {
  writer._writeFixedLengthString(this.database, 0, 32); // Database name
  writer._writeFixedLengthString(this.user, 0, 32); // User login ID
  writer._writeFixedLengthString(this.password, 0, 32); // User login password
  writer._writeFiller(512, 0); // Used for extended connection info
  writer._writeFiller(20, 0); // Reserved

  return writer;
};

/**
 * Read data
 * @param parser
 */
OpenDatabasePacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - DATA_TYPES.INT_SIZEOF * 2);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.brokerInfo = parser._parseBytes(DATA_TYPES.BROKER_INFO_SIZEOF); // Broker information
    this.sessionId = parser._parseInt(); // Unique session ID
  }

  return this;
};

OpenDatabasePacket.prototype.getBufferLength = function () {
	var bufferLength =
			// Fixed database length +
			// User login ID +
			// User login password.
			32 * 3 +
			// Used for extended connection info.
			512 +
			// Reserved.
			20
			;

	return bufferLength;
};
