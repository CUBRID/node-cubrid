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
  this.tableNamePattern = options.tableNamePattern;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.resultTuple = 0;
  this.errorCode = 0;
  this.errorMsg = '';
  this.schemaInfo = null;
}

/**
 * Write request schema data
 * @param writer
 */
GetSchemaPacket.prototype.writeRequestSchema = function (writer) {
  writer._writeInt(this.getRequestSchemaBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_SCHEMA_INFO);

  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.schemaType); // Schema type

  if (this.tableNamePattern) {
    writer._writeNullTerminatedString(this.tableNamePattern); // Table name pattern
  } else {
    writer._writeInt(0); // Null; this is where restrictions should go - arg1: tableNamePattern
  }

  writer._writeInt(0); // Null; this is where restrictions should go - arg2: columnNamePattern

  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCISchemaPatternMatchFlag.CCI_CLASS_NAME_PATTERN_MATCH |
    CAS.CCISchemaPatternMatchFlag.CCI_ATTR_NAME_PATTERN_MATCH); // Pattern match flag

  return writer;
};

/**
 * Write fetch schema data
 * @param writer
 */
GetSchemaPacket.prototype.writeFetchSchema = function (writer) {
  writer._writeInt(this.getFetchSchemaBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_FETCH);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.responseCode); // ServerHandler
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(1); //Start position
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.resultTuple); // Fetch size; 0 = default; recommended = 100
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(0); // Is case sensitive
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); // Is the ResultSet index...?

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
    this.resultTuple = parser._parseInt(); // Result tuple
    var numColInfo = parser._parseInt(); // Number of columns
    this.infoArray = [];
    for (var i = 0; i < numColInfo; i++) {
      var info = new ColumnMetaData();
      info.ColumnType = parser._parseByte(); // Column data type
      info.scale = parser._parseShort(); // Scale
      info.precision = parser._parseInt(); // Precision
      var len = parser._parseInt();
      info.Name = parser._parseNullTerminatedString(len); // Column name
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
    this.tupleCount = parser._parseInt(); // Tuple count
    var SchemaInfo = new Array(this.tupleCount);
    for (var i = 0; i < this.tupleCount; i++) {
      var index = parser._parseInt(); // Column index
      var Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF); // OID
      switch (this.schemaType) {
        case CAS.CUBRIDSchemaType.CCI_SCH_CLASS:
          length = parser._parseInt();
          var sch_class_name = parser._parseNullTerminatedString(length); // Table name
          length = parser._parseInt(); // Always = 2 - Indicates that Table type is a short value
          var sch_class_name_type = parser._parseShort(); // Table type
          SchemaInfo[i] = { Name : sch_class_name, Type : sch_class_name_type};
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_VCLASS:
          length = parser._parseInt();
          var sch_vclass_name = parser._parseNullTerminatedString(length); // View name
          length = parser._parseInt();
          var sch_vclass_type = parser._parseShort(); // View type
          SchemaInfo[i] = { Name : sch_vclass_name, Type : sch_vclass_type};
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_ATTRIBUTE:
          length = parser._parseInt();
          var sch_attribute_columnName = parser._parseNullTerminatedString(length); // Column name
          length = parser._parseInt();
          var sch_attribute_domain = parser._parseShort(); // Domain
          length = parser._parseInt();
          var sch_attribute_scale = parser._parseShort(); // Scale
          length = parser._parseInt();
          var sch_attribute_precision = parser._parseInt(); // Precision
          length = parser._parseInt();
          var sch_attribute_indexed = parser._parseShort(); // Idexed
          length = parser._parseInt();
          var sch_attribute_non_null = (parser._parseShort() === 1); // Non null
          length = parser._parseInt();
          var sch_attribute_shared = parser._parseShort(); // Shared
          length = parser._parseInt();
          var sch_attribute_unique = (parser._parseShort() === 1); // Unique
          length = parser._parseInt();
          // If lentgth > 0 the column has a default value
          if (length > 0) {
            parser._parseNullTerminatedString(length); // Default value
          }
          length = parser._parseInt();
          var sch_attribute_attr_order = parser._parseInt(); // Column order
          length = parser._parseInt();
          var sch_attribute_class_name = parser._parseNullTerminatedString(length); // Class/Table name
          length = parser._parseInt();
          var sch_attribute_source_class = parser._parseNullTerminatedString(length); // Source Class/Table name
          length = parser._parseInt();
          var sch_attribute_is_key = (parser._parseShort() === 1); // Is key?
          SchemaInfo[i] = {
            Name        : sch_attribute_columnName,
            Scale       : sch_attribute_scale,
            Precision   : sch_attribute_precision,
            NonNull     : sch_attribute_non_null,
            Unique      : sch_attribute_unique,
            ClassName   : sch_attribute_class_name,
            SourceClass : sch_attribute_source_class,
            IsKey       : sch_attribute_is_key
          };
          break;
          case CAS.CUBRIDSchemaType.CCI_SCH_CONSTRAIT:
          length = parser._parseInt();
          var sch_constraint_type = parser._parseShort(); // Constraint type
          length = parser._parseInt();
          var sch_constraint_constraintName = parser._parseNullTerminatedString(length); // Constraint name
          length = parser._parseInt();
          var sch_constraint_attributeName = parser._parseNullTerminatedString(length); // Constraint column name
          length = parser._parseInt();
          var sch_constraint_num_pages = parser._parseShort(); // Pages
          length = parser._parseInt();
          var sch_constraint_num_keys = parser._parseShort(); // Keys
          length = parser._parseInt();
          var sch_constraint_primaryKey = (parser._parseShort() === 1); // Primary key?
          length = parser._parseInt();
          var sch_constraint_keyOrder = parser._parseShort(); // Key order
          SchemaInfo[i] = {
            ConstraintName : sch_constraint_constraintName,
            AttributeName  : sch_constraint_attributeName,
            Type           : sch_constraint_type,
            PrimaryKey     : sch_constraint_primaryKey
          };
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_EXPORTED_KEYS:
          length = parser._parseInt();
          var sch_exported_keys_pkTableName = parser._parseNullTerminatedString(length); // Primary key table name
          length = parser._parseInt();
          var sch_exported_keys_pkColumnName = parser._parseNullTerminatedString(length); // Primary key column name
          length = parser._parseInt();
          var sch_exported_keys_fkTableName = parser._parseNullTerminatedString(length); // Foreig key table name
          length = parser._parseInt();
          var sch_exported_keys_fkColumnName = parser._parseNullTerminatedString(length); // Foreign key column name
          length = parser._parseInt();
          var sch_exported_keys_keySeq = parser._parseShort(); // Sequence type
          length = parser._parseInt();
          var sch_exported_keys_updateAction = parser._parseShort(); // Update action
          length = parser._parseInt();
          var sch_exported_keys_deleteAction = parser._parseShort(); // Delete action
          length = parser._parseInt();
          var sch_exported_keys_fkName = parser._parseNullTerminatedString(length); // Foreign key length
          length = parser._parseInt();
          var sch_exported_keys_pkName = parser._parseNullTerminatedString(length); // Primary key length
          SchemaInfo[i] = {
            FkName       : sch_exported_keys_fkName,
            PkName       : sch_exported_keys_pkName,
            FkTableName  : sch_exported_keys_fkTableName,
            PkTableName  : sch_exported_keys_pkTableName,
            FkColumnName : sch_exported_keys_fkColumnName,
            PkColumnName : sch_exported_keys_pkColumnName,
            UpdateAction : sch_exported_keys_updateAction,
            DeleteAction : sch_exported_keys_deleteAction
          };
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_IMPORTED_KEYS:
          length = parser._parseInt();
          var sch_imported_keys_pkTableName = parser._parseNullTerminatedString(length); // Primary key table name
          length = parser._parseInt();
          var sch_imported_keys_pkColumnName = parser._parseNullTerminatedString(length); // Primary key column name
          length = parser._parseInt();
          var sch_imported_keys_fkTableName = parser._parseNullTerminatedString(length); // Foreign key table name
          length = parser._parseInt();
          var sch_imported_keys_fkColumnName = parser._parseNullTerminatedString(length); // Foreign key column name
          length = parser._parseInt();
          var sch_imported_keys_keySeq = parser._parseShort(); // Sequence type
          length = parser._parseInt();
          var sch_imported_keys_updateAction = parser._parseShort(); // Update action
          length = parser._parseInt();
          var sch_imported_keys_deleteAction = parser._parseShort(); // Delete action
          length = parser._parseInt();
          var sch_imported_keys_fkName = parser._parseNullTerminatedString(length); // Foreign key name
          length = parser._parseInt();
          var sch_imported_keys_pkName = parser._parseNullTerminatedString(length); // Primary key name
          SchemaInfo[i] = {
            FkName       : sch_imported_keys_fkName,
            PkName       : sch_imported_keys_pkName,
            FkTableName  : sch_imported_keys_fkTableName,
            PkTableName  : sch_imported_keys_pkTableName,
            FkColumnName : sch_imported_keys_fkColumnName,
            PkColumnName : sch_imported_keys_pkColumnName,
            UpdateAction : sch_imported_keys_updateAction,
            DeleteAction : sch_imported_keys_deleteAction
          };
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_PRIMARY_KEY:
          length = parser._parseInt();
          var sch_primary_key_className = parser._parseNullTerminatedString(length); // Table name
          length = parser._parseInt();
          var sch_primary_key_columnName = parser._parseNullTerminatedString(length); // Column name
          length = parser._parseInt();
          var sch_primary_key_keySeq = parser._parseInt(); // Sequence type
          length = parser._parseInt();
          var sch_primary_key_keyName = parser._parseNullTerminatedString(length); // Primary key name
          SchemaInfo[i] = {
            TableName  : sch_primary_key_className,
            ColumnName : sch_primary_key_columnName,
            KeyName    : sch_primary_key_keyName
          };
          break;
        case CAS.CUBRIDSchemaType.CCI_SCH_CLASS_PRIVILEGE:
          length = parser._parseInt();
          var sch_class_privilege_className = parser._parseNullTerminatedString(length); // Table name
          length = parser._parseInt();
          var sch_class_privilege_privilege = parser._parseNullTerminatedString(length); // Privilege name
          length = parser._parseInt();
          var sch_class_privilege_grantable = (parser._parseNullTerminatedString(length) === 'YES'); // Grantable ('YES' or 'NO')
          SchemaInfo[i] = {
            TableName : sch_class_privilege_className,
            Privilege : sch_class_privilege_privilege,
            Grantable : sch_class_privilege_grantable
          };
          break;
      }
    }
    this.schemaInfo = SchemaInfo;

    return this;
  }
};

GetSchemaPacket.prototype.getRequestSchemaBufferLength = function () {
	var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
			DATA_TYPES.BYTE_SIZEOF + (this.tableNamePattern !== null ? this.tableNamePattern.length + 1 : 0);

	return bufferLength;
};

GetSchemaPacket.prototype.getFetchSchemaBufferLength = function () {
	var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

	return bufferLength;
};
