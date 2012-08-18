var DATA_TYPES = require('../constants/DataTypes'),
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
  writer._writeFixedLengthString(this.database, 0, 32);
  writer._writeFixedLengthString(this.user, 0, 32);
  writer._writeFixedLengthString(this.password, 0, 32);
  writer._writeFiller(512, 0);
  writer._writeFiller(20, 0);

  return writer;
};

/**
 * Read data
 * @param parser
 */
OpenDatabasePacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(4);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - DATA_TYPES.INT_SIZEOF * 2);
    if (this.errorMsg.length == 0) {
      for (var iter = 0; iter < ErrorMessages.CASErrorMsgId.length; iter++) {
        if (this.errorCode == ErrorMessages.CASErrorMsgId[iter][1]) {
          this.errorMsg = ErrorMessages.CASErrorMsgId[iter][0];
          break;
        }
      }
    }
  } else {
    //this.processId = this.responseCode;
    this.brokerInfo = parser._parseBytes(8);
    this.sessionId = parser._parseInt();
  }

  return this;
};


