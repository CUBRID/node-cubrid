'use strict';

const CAS = require('../constants/CASConstants');
const ColumnMetaData = require('../resultset/ColumnMetaData');
const DATA_TYPES = require('../constants/DataTypes');

module.exports = GetSchemaPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function GetSchemaPacket(options) {
  this.options = options;

  typeof options.shardId === 'undefined' && (options.shardId = 0);
}

/**
 * Write request schema data
 * @param writer
 */
GetSchemaPacket.prototype.writeRequestSchema = function (writer) {
  const options = this.options;

  writer._writeInt(this.getRequestSchemaBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_SCHEMA_INFO);

  writer.addInt(options.schemaType);

  if (options.tableNamePattern) {
    // arg1: Table name pattern
    writer._writeNullTerminatedString(options.tableNamePattern);
  } else {
    // Null; this is where restrictions should go - arg1: tableNamePattern
    writer.addNull();
  }

  // arg2:
  writer.addNull();

  // Pattern match flag.
  writer.addByte(CAS.CCISchemaPatternMatchFlag.CCI_CLASS_NAME_PATTERN_MATCH |
      CAS.CCISchemaPatternMatchFlag.CCI_ATTR_NAME_PATTERN_MATCH);

  if (options.protocolVersion > 4) {
    writer.addInt(options.shardId);
  }

  return writer;
};

/**
 * Write fetch schema data
 * @param writer
 */
GetSchemaPacket.prototype.writeFetchSchema = function (writer) {
  const options = this.options;

  writer._writeInt(this.getFetchSchemaBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_FETCH);
  writer.addInt(this.responseCode); // ServerHandler
  writer.addInt(1); //Start position
  writer.addInt(this.resultTuple);
  writer.addByte(0); // Is case sensitive
  writer.addInt(0); // Is the ResultSet index...?

  return writer;
};

/**
 * Read request schema data
 * @param parser
 */
GetSchemaPacket.prototype.parseRequestSchema = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }

  this.resultTuple = parser._parseInt(); // Result tuple
  const numColInfo = parser._parseInt(); // Number of columns

  this.infoArray = [];

  for (let i = 0; i < numColInfo; ++i) {
    let info = new ColumnMetaData();

    info.ColumnType = parser._parseByte(); // Column data type
    info.scale = parser._parseShort(); // Scale
    info.precision = parser._parseInt(); // Precision

    const len = parser._parseInt();
    info.Name = parser._parseNullTerminatedString(len); // Column name

    this.infoArray.push(info);
  }
};

/**
 * Read fetch schema data
 * @param parser
 */
GetSchemaPacket.prototype.parseFetchSchema = function (parser) {
  const options = this.options;
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode !== 0) {
    return parser.readError(responseLength);
  }

  this.tupleCount = parser._parseInt();

  let length = 0;
  let SchemaInfo = new Array(this.tupleCount);

  for (let i = 0; i < this.tupleCount; ++i) {
    // Column index.
    parser._parseInt();
    // OID
    parser._parseBytes(DATA_TYPES.OID_SIZEOF);

    switch (options.schemaType) {
      case CAS.CUBRIDSchemaType.CCI_SCH_CLASS: {
        length = parser._parseInt();
        // Table name
        const Name = parser._parseNullTerminatedString(length);
        // Always = 2 - Indicates that Table type is a short value
        length = parser._parseInt();
        // Table type
        const Type = parser._parseShort();

        SchemaInfo[i] = { Name, Type };

        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_VCLASS: {
        length = parser._parseInt();
        // View name
        const Name = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // View type
        const Type = parser._parseShort();

        SchemaInfo[i] = { Name, Type };

        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_ATTRIBUTE: {
        length = parser._parseInt();
        // Column name
        const Name = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // sch_attribute_domain
        parser._parseShort();
        length = parser._parseInt();
        const Scale = parser._parseShort();
        length = parser._parseInt();
        const Precision = parser._parseInt();
        length = parser._parseInt();
        // sch_attribute_indexed
        parser._parseShort();
        length = parser._parseInt();
        const NonNull = (parser._parseShort() === 1);
        length = parser._parseInt();
        // sch_attribute_shared
        parser._parseShort();
        length = parser._parseInt();
        const Unique = (parser._parseShort() === 1);
        length = parser._parseInt();

        // If `length > 0` the column has a default value
        if (length) {
          parser._parseNullTerminatedString(length); // Default value
        }

        length = parser._parseInt();
        // sch_attribute_attr_order
        parser._parseInt();
        length = parser._parseInt();
        const ClassName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const SourceClass = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const IsKey = (parser._parseShort() === 1);

        SchemaInfo[i] = {
          Name,
          Scale,
          Precision,
          NonNull,
          Unique,
          ClassName,
          SourceClass,
          IsKey
        };

        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_CONSTRAINT: {
        length = parser._parseInt();
        // Constraint type
        const Type = parser._parseShort();
        length = parser._parseInt();
        const ConstraintName = parser._parseNullTerminatedString(length); // Constraint name
        length = parser._parseInt();
        // Constraint column name
        const AttributeName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // sch_constraint_num_pages
        parser._parseShort(); // Pages
        length = parser._parseInt();
        // sch_constraint_num_keys
        parser._parseShort();
        length = parser._parseInt();
        const PrimaryKey = (parser._parseShort() === 1);
        length = parser._parseInt();
        // sch_constraint_keyOrder
        parser._parseShort();
        SchemaInfo[i] = {
          ConstraintName,
          AttributeName,
          Type,
          PrimaryKey
        };
        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_EXPORTED_KEYS: {
        length = parser._parseInt();
        const PkTableName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const PkColumnName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const FkTableName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const FkColumnName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // Sequence type: sch_exported_keys_keySeq
        parser._parseShort();
        length = parser._parseInt();
        const UpdateAction = parser._parseShort();
        length = parser._parseInt();
        const DeleteAction = parser._parseShort();
        length = parser._parseInt();
        const FkName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const PkName = parser._parseNullTerminatedString(length);

        SchemaInfo[i] = {
          FkName,
          PkName,
          FkTableName,
          PkTableName,
          FkColumnName,
          PkColumnName,
          UpdateAction,
          DeleteAction
        };

        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_IMPORTED_KEYS: {
        length = parser._parseInt();
        const PkTableName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const PkColumnName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const FkTableName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const FkColumnName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // Sequence type: sch_imported_keys_keySeq
        parser._parseShort();
        length = parser._parseInt();
        const UpdateAction = parser._parseShort();
        length = parser._parseInt();
        const DeleteAction = parser._parseShort();
        length = parser._parseInt();
        const FkName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const PkName = parser._parseNullTerminatedString(length);

        SchemaInfo[i] = {
          FkName,
          PkName,
          FkTableName,
          PkTableName,
          FkColumnName,
          PkColumnName,
          UpdateAction,
          DeleteAction
        };
        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_PRIMARY_KEY: {
        length = parser._parseInt();
        const TableName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const ColumnName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // Sequence type: sch_primary_key_keySeq
        parser._parseInt();
        length = parser._parseInt();
        const KeyName = parser._parseNullTerminatedString(length);

        SchemaInfo[i] = {
          TableName,
          ColumnName,
          KeyName
        };

        break;
      }
      case CAS.CUBRIDSchemaType.CCI_SCH_CLASS_PRIVILEGE: {
        length = parser._parseInt();
        const TableName = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        const Privilege = parser._parseNullTerminatedString(length);
        length = parser._parseInt();
        // Grantable ('YES' or 'NO')
        const Grantable = (parser._parseNullTerminatedString(length) === 'YES');

        SchemaInfo[i] = {
          TableName,
          Privilege,
          Grantable
        };
      }
        break;
    }
  }

  this.schemaInfo = SchemaInfo;
};

GetSchemaPacket.prototype.getRequestSchemaBufferLength = function () {
  const options = this.options;

  let bufferLength =
      // Total length of the request without itself and CAS info.
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      // CAS info.
      DATA_TYPES.CAS_INFO_SIZE +
      // CAS function.
      DATA_TYPES.BYTE_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // Schema type.
      DATA_TYPES.INT_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // arg1: tableNamePattern length
      (typeof options.tableNamePattern === 'string' ? options.tableNamePattern.length + 1 : 0) +
      // The length of the next part.
      // arg2: is null.
      DATA_TYPES.INT_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // Pattern match flag.
      DATA_TYPES.BYTE_SIZEOF;

  if (options.protocolVersion > 4) {
    bufferLength +=
        // The length of the next part.
        DATA_TYPES.INT_SIZEOF +
        // ShardId.
        DATA_TYPES.INT_SIZEOF;
  }

  return bufferLength;
};

GetSchemaPacket.prototype.getFetchSchemaBufferLength = function () {
  const bufferLength =
      // Total length of the request without itself and CAS info.
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      // CAS info.
      DATA_TYPES.CAS_INFO_SIZE +
      // CAS function.
      DATA_TYPES.BYTE_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF;

  return bufferLength;
};
