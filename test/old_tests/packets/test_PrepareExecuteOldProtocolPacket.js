var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  PrepareExecuteOldProtocolPacket = require('../PrepareExecuteOldProtocolPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testExecuteQueryPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {sql : 'select * from code',
    casInfo          : [0, 255, 255, 255],
    autoCommitMode   : 1,
    dbVersion        : '8.4.1',
    paramValues      : {},
    paramTypes       : {}
  };
  var prepareExecuteOldProtocolPacket = new PrepareExecuteOldProtocolPacket(options);

  prepareExecuteOldProtocolPacket.writePrepare(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 34); // Total length

  assert.equal(packetWriter._toBuffer()[4], 0); // CasInfo
  assert.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_PREPARE);
  assert.equal(packetWriter._toBuffer()[12], 19);
  assert.equal(packetWriter._toBuffer().slice(13, 31).toString(), 'select * from code');
  assert.equal(packetWriter._toBuffer()[35], 1);
  assert.equal(packetWriter._toBuffer()[36], CAS.CCIPrepareOption.CCI_PREPARE_NORMAL);
  assert.equal(packetWriter._toBuffer()[40], 1);
  assert.equal(packetWriter._toBuffer()[41], 1);

  packetReader.write(new Buffer([0, 0, 0, 108, 1, 255, 255, 255, 0, 0, 0, 1, 255, 255, 255, 255, 21, 0, 0, 0, 0, 0, 0, 0,
                                 0, 2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 7, 115, 95, 110, 97, 109, 101, 0, 0, 0, 0, 1, 0, 0,
                                 0, 0, 5, 99, 111, 100, 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0,
                                 6, 0, 0, 0, 7, 102, 95, 110, 97, 109, 101, 0, 0, 0, 0, 1, 0, 0, 0, 0, 5, 99, 111, 100,
                                 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]));

  prepareExecuteOldProtocolPacket.parsePrepare(packetReader);
  assert.equal(prepareExecuteOldProtocolPacket.queryHandle, 1);
  assert.equal(prepareExecuteOldProtocolPacket.resultCacheLifetime, -1);
  assert.equal(prepareExecuteOldProtocolPacket.statementType, 21);
  assert.equal(prepareExecuteOldProtocolPacket.bindCount, 0);
  assert.equal(prepareExecuteOldProtocolPacket.isUpdatable, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].ColumnType, 1);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].Scale, -1);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].Name, "s_name");
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].RealName, "");
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].TableName, "code");
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsNullable, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].DafaultValue, "");
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsAutoIncrement, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsUniqueKey, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsPrimaryKey, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsReverseIndex, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsReverseUnique, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsForeignKey, false);
  assert.equal(prepareExecuteOldProtocolPacket.infoArray[0].IsShared, false);

  packetReader = new PacketReader();
  packetWriter = new PacketWriter();
  prepareExecuteOldProtocolPacket.writeExecute(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 69); // Total length

  assert.equal(packetWriter._toBuffer()[4], 1); // CasInfo
  assert.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_EXECUTE);
  assert.equal(packetWriter._toBuffer()[16], 1);
  assert.equal(packetWriter._toBuffer()[21], CAS.CCIExecutionOption.CCI_EXEC_NORMAL);
  assert.equal(packetWriter._toBuffer()[29], 0);
  assert.equal(packetWriter._toBuffer()[37], 0);
  assert.equal(packetWriter._toBuffer()[41], 0);
  assert.equal(packetWriter._toBuffer()[46], 1);
  assert.equal(packetWriter._toBuffer()[51], 1);
  assert.equal(packetWriter._toBuffer()[56], 1);
  assert.equal(packetWriter._toBuffer()[68], 0);
  assert.equal(packetWriter._toBuffer()[76], 0);

  packetReader.write(new Buffer([0, 0, 0, 205, 0, 255, 255, 255, 0, 0, 0, 6, 0, 0, 0, 0, 1, 21, 0, 0, 0, 6, 0, 0, 0, 0,
                                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0,
                                 0, 0, 0, 0, 0, 0, 2, 88, 0, 0, 0, 0, 6, 77, 105, 120, 101, 100, 0, 0, 0, 0, 2, 0, 0, 0,
                                 0, 0, 0, 0, 0, 0, 0, 0, 2, 87, 0, 0, 0, 0, 6, 87, 111, 109, 97, 110, 0, 0, 0, 0, 3, 0,
                                 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 77, 0, 0, 0, 0, 4, 77, 97, 110, 0, 0, 0, 0, 4, 0, 0, 0,
                                 0, 0, 0, 0, 0, 0, 0, 0, 2, 66, 0, 0, 0, 0, 7, 66, 114, 111, 110, 122, 101, 0, 0, 0, 0,
                                 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 83, 0, 0, 0, 0, 7, 83, 105, 108, 118, 101, 114,
                                 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 71, 0, 0, 0, 0, 5, 71, 111, 108, 100, 0]));

  var resultSet = prepareExecuteOldProtocolPacket.parseExecute(packetReader).resultSet;

  assert.equal(resultSet, '{"ColumnNames":["s_name","f_name"],"ColumnDataTypes":["Char","String"],"RowsCount":6,"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"],["B","Bronze"],["S","Silver"],["G","Gold"]]}');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testExecuteQueryPacket_01();

console.log('Unit test ended OK.');

