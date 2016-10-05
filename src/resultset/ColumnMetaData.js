const CAS = require('../constants/CASConstants');

/**
 * Column meta data
 * @constructor
 */
function ColumnMetaData() {
  this.ColumnType = null;
  this.CollectionElementType = CAS.CUBRIDDataType.CCI_U_TYPE_UNKNOWN;
  this.Scale = -1;
  this.Precision = -1;
  this.RealName = null;
  this.TableName = null;
  this.Name = null;
  this.IsNullabe = false;

  this.DefaultValue = null;
  this.IsAutoIncrement = false;
  this.IsUniqueKey = false;
  this.IsPrimaryKey = false;
  this.IsForeignKey = false;
  this.IsReverseIndex = false;
  this.IsReverseUnique = false;
  this.IsShared = false;
}

module.exports = ColumnMetaData;
