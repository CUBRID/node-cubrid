var DRIVER_VERSION = require('../constants/DriverVersion'),
		DATA_TYPES = require('../constants/DataTypes');

module.exports = ClientInfoExchangePacket;

/**
 * Constructor
 * @constructor
 */
function ClientInfoExchangePacket() {
  this.newConnectionPort = 0;
}

/**
 * Write data
 * @param writer
 */
ClientInfoExchangePacket.prototype.write = function (writer) {
  writer._writeFixedLengthString('CUBRK', 0, 5);
  writer._writeByte(3); // 3 = JDBC client type
  writer._writeByte(DRIVER_VERSION.CAS_VER); // CAS client/driver version
  writer._writeByte(0);
  writer._writeByte(0);
  writer._writeByte(0);

  return writer;
};

/**
 * Read data
 * @param parser
 */
ClientInfoExchangePacket.prototype.parse = function (parser) {
  this.newConnectionPort = parser._parseInt(); // (TCP/IP) Port value

  return this;
};

ClientInfoExchangePacket.prototype.getBufferLength = function () {
	var bufferLength =
			// The length of "CUBRK" string.
			5 +
			// JDBC client type + CAS version + 0 + 0 + 0. All bytes.
			DATA_TYPES.BYTE_SIZEOF * 5;

	return bufferLength;
};
