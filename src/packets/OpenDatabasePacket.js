'use strict';

const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @param options
 * @constructor
 */
function OpenDatabasePacket(options) {
  this.options = options;
}

/**
 * Write data
 * @param writer
 */
OpenDatabasePacket.prototype.write = function (writer) {
  const options = this.options;
  
  writer._writeFixedLengthString(options.database, 0, 32); // Database name
  writer._writeFixedLengthString(options.user, 0, 32); // User login ID
  writer._writeFixedLengthString(options.password, 0, 32); // User login password
  writer._writeFiller(512, 0); // Used for extended connection info
  writer._writeFiller(20, 0); // Reserved

  return writer;
};

/**
 * Read data
 * @param parser
 */
OpenDatabasePacket.prototype.parse = function (parser) {
  const logger = this.options.logger;
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  logger.debug('OpenDatabasePacket: casInfo', this.casInfo);

  this.responseCode = parser._parseInt();
  
  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }

  /*
  * Broker information: 8 bytes.
  * Byte 1: DBMS Type. 1 = CUBRID.
  * Byte 2: Reserved. 1.
  * Byte 3: Statement Polling. 1.
  * Byte 4: CCI_PCONNECT. 0.
  * Byte 5: Protocol Version.
  * Byte 6: Function Flag.
  * Byte 7: Reserved. 0.
  * Byte 8: Reserved. 0.
  * */
  const brokerInfo = parser._parseBytes(DATA_TYPES.BROKER_INFO_SIZEOF);

  logger.debug('OpenDatabasePacket: brokerInfo', brokerInfo);

  const protocolVersion = CAS.getProtocolVersion(brokerInfo[4]);
  logger.debug('OpenDatabasePacket: protocolVersion', protocolVersion);

  // Freeze the object, i.e. make it immutable.
  this.brokerInfo = Object.freeze({
    dbType: brokerInfo[0],
    protocolVersion,
    statementPolling: brokerInfo[2],
  });

  // Unique session ID.
  this.sessionId = parser._parseInt();
};

OpenDatabasePacket.prototype.getBufferLength = function () {
	const bufferLength =
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

module.exports = OpenDatabasePacket;
