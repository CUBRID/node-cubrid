var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  ColumnMetaData = require('../resultset/ColumnMetaData'),
  CAS = require('../constants/CASConstants');

module.exports = GetSchemaPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function GetSchemaPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.schemaType = options.schemaType;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write request schema data
 * @param writer
 */
GetSchemaPacket.prototype.writeRequestSchema = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + 5 * DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_SCHEMA_INFO);

  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.schemaType);

  writer._writeInt(0); // null; this is where restrictions should go - arg1: tableNamePattern

  writer._writeInt(0); // null; this is where restrictions should go - arg2: columnNamePattern

  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(3); // flag; TODO Document this value

  return writer;
};

/**
 * Write fetch schema data
 * @param writer
 */
GetSchemaPacket.prototype.writeFetchSchema = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_FETCH);
  writer._writeInt(DATA_TYPES.INT_SIZEOF); //int sizeof
  writer._writeInt(this.responseCode); //serverHandler
  writer._writeInt(DATA_TYPES.INT_SIZEOF); //int sizeof
  writer._writeInt(1); //Start position
  writer._writeInt(DATA_TYPES.INT_SIZEOF); //int sizeof
  writer._writeInt(100); //Fetch size; 0 = default; recommended = 100
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF); //byte sizeof
  writer._writeByte(0); //Is case sensitive
  writer._writeInt(DATA_TYPES.INT_SIZEOF); //int sizeof
  writer._writeInt(0); //Is the ResultSet index...?

  return writer;
};

/**
 * Read request schema data
 * @param parser
 */
GetSchemaPacket.prototype.parseRequestSchema = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    var resultTuple = parser._parseInt();
    var numColInfo = parser._parseInt();
    this.infoArray = [];
    for (var i = 0; i < numColInfo; i++) {
      var info = new ColumnMetaData();
      info.ColumnType = parser._parseByte();
      info.scale = parser._parseShort();
      info.precision = parser._parseInt();
      var len = parser._parseInt();
      info.Name = parser._parseNullTerminatedString(len);
      this.infoArray[i] = info;
    }
  }

  return this;
};

/**
 * Read fetch schema data
 * @param parser
 */
GetSchemaPacket.prototype.parseFetchSchema = function (parser) {
  var length = 0;
  var responseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode !== 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.tupleCount = parser._parseInt();
    var SchemaInfo = new Array(this.tupleCount);
    for (var i = 0; i < this.tupleCount; i++) {
      var index = parser._parseInt();
      var Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF);
      switch (this.schemaType) {
        case CAS.CUBRIDSchemaType.CCI_SCH_CLASS:
          length = parser._parseInt();
          var name = parser._parseNullTerminatedString(length);
          length = parser._parseInt();
          var type = parser._parseShort();
          SchemaInfo[i] = { Name : name, Type : type};
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_VCLASS:
          length = parser._parseInt();
          var name = parser._parseNullTerminatedString(length);
          length = parser._parseInt();
          var type = parser._parseShort();
          SchemaInfo[i] = { Name : name, Type : type};
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_ATTRIBUTE:
          length = parser._parseInt();
          var name = parser._parseNullTerminatedString(length);
          length = parser._parseInt();
          var domain = parser._parseShort();
          length = parser._parseInt();
          var domain = parser._parseInt();
          length = parser._parseInt();
          var scale = parser._parseInt();
          length = parser._parseInt();
          var precision = parser._parseInt();
          length = parser._parseInt();
          var indexed = parser._parseInt();
          length = parser._parseInt();
          var non_null = parser._parseInt();
          length = parser._parseInt();
          var shared = parser._parseInt();
          length = parser._parseInt();
          var unique = parser._parseInt();
          length = parser._parseInt();
          var def = parser._parseInt();
          length = parser._parseInt();
          var attr_order = parser._parseInt();
          length = parser._parseInt();
          var class_name = parser._parseNullTerminatedString(length);
          length = parser._parseInt();
          var source_class = parser._parseNullTerminatedString(length);
          length = parser._parseInt();
          var is_key = parser._parseShort();
          SchemaInfo[i] = {
            Name        : name,
            Domain      : domain,
            Scale       : scale,
            Precision   : precision,
            Indexed     : index,
            NonNull     : non_null,
            Shared      : shared,
            Unique      : unique,
            Default     : def,
            AttrOrder   : attr_order,
            ClassName   : class_name,
            SourceClass : source_class,
            IsKey       : is_key
          };
          break;
      }
    }
    return SchemaInfo;
  }
};
