const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @param options
 * @constructor
 */
function FetchPacket(options) {
  this.options = options;
  
  // Fetch size; 0 = default; recommended = 100
  typeof options.size === 'undefined' && (options.size = 100);
}

/**
 * Write data
 * @param writer
 * @param queryPacket
 */
FetchPacket.prototype.write = function (writer, queryPacket) {
  const options = this.options;

  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_FETCH);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(queryPacket.queryHandle); // Query handle
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(queryPacket.currentTupleCount + 1); // Start position (= current cursor position + 1)
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(options.size);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(0); // Is case sensitive
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); // Is the ResultSet index...?

  return writer;
};

/**
 * Read data
 * @param parser
 * @param queryPacket
 */
FetchPacket.prototype.parse = function (parser, queryPacket) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode !== 0) {
    return parser.readError(responseLength);
  }

  this.tupleCount = parser._parseInt();

  this.options.logger.debug(`fetch tupleCount = ${this.tupleCount}`);

  this.resultSet = {
    ColumnValues: queryPacket.getValues(parser, this.tupleCount)
  };
};

FetchPacket.prototype.getBufferLength = function () {
  const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
      DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  return bufferLength;
};

module.exports = FetchPacket;
