var DATA_TYPES = require('../constants/DataTypes'),
		ErrorMessages = require('../constants/ErrorMessages'),
		Helpers = require('../utils/Helpers.js'),
		CAS = require('../constants/CASConstants');

module.exports = CloseQueryPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function CloseQueryPacket(options) {
	options = options || {};

	this.casInfo = options.casInfo;
	this.reqHandle = options.reqHandle;
	this.dbVersion = options.dbVersion;

	this.responseCode = 0;
	this.errorCode = 0;
	this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
CloseQueryPacket.prototype.write = function (writer) {
	var bufferLength = this.getBufferLength();

	writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
	writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
	writer._writeByte(CAS.CASFunctionCode.CAS_FC_CLOSE_REQ_HANDLE);
	writer._writeInt(DATA_TYPES.INT_SIZEOF);
	writer._writeInt(this.reqHandle); // Query handle
	writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
	writer._writeByte(0); // Autocommit mode

	return writer;
};

/**
 * Read data
 * @param parser
 */
CloseQueryPacket.prototype.parse = function (parser) {
	var responseLength = parser._parseInt();

	this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
	this.responseCode = parser._parseInt();

	if (this.responseCode < 0) {
		this.errorCode = parser._parseInt();
		this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);

		if (this.errorMsg.length === 0) {
			this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
		}
	}

	return this;
};

CloseQueryPacket.prototype.getBufferLength = function () {
	var bufferLength =
			// The size of the data to be sent (4-byte integer).
			DATA_TYPES.DATA_LENGTH_SIZEOF +
			// The size of the CAS_INFO data (also 4-byte integer).
			DATA_TYPES.CAS_INFO_SIZE +
			// The code of the CAS function to execute (1-byte integer value).
			// "Close Query" function must be executed, i.e. the function code = `6`.
			DATA_TYPES.BYTE_SIZEOF +
			// The size of the next piece of data which is the ID
			// of the request handler.
			DATA_TYPES.INT_SIZEOF +
			// The actual request handler ID as 4-byte integer.
			DATA_TYPES.INT_SIZEOF +
			// The size of the next piece of data.
			DATA_TYPES.INT_SIZEOF +
			// The value of the autocommit.
			DATA_TYPES.BYTE_SIZEOF;

	return bufferLength;
};
