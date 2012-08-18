var DRIVER_VERSION = require('../constants/DriverVersion');

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
  writer._writeByte(DRIVER_VERSION.CAS_VER);
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
  this.newConnectionPort = parser._parseInt();

  return this;
};

