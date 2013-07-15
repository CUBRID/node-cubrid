var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  ExecuteQueryPacket = require('../ExecuteQueryPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testExecuteQueryPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {sql : 'select * from code', casInfo : [0, 255, 255, 255], autoCommitMode : 1, dbVersion : '8.4.1'};
  var executeQueryPacket = new ExecuteQueryPacket(options);

  executeQueryPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 87); // Total length

  assert.equal(packetWriter._toBuffer()[4], 0); // CasInfo
  assert.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_PREPARE_AND_EXECUTE);
  assert.equal(packetWriter._toBuffer()[16], 3);
  assert.equal(packetWriter._toBuffer().slice(21, 39).toString(), 'select * from code');
  assert.equal(packetWriter._toBuffer()[44], 0);
  assert.equal(packetWriter._toBuffer()[49], 1);
  assert.equal(packetWriter._toBuffer()[54], CAS.CCIExecutionOption.CCI_EXEC_QUERY_ALL);
  assert.equal(packetWriter._toBuffer()[62], 0);
  assert.equal(packetWriter._toBuffer()[70], 0);
  assert.equal(packetWriter._toBuffer()[82], 0);
  assert.equal(packetWriter._toBuffer()[86], 0);
  assert.equal(packetWriter._toBuffer()[94], 0);

  packetReader.write(new Buffer([0, 0, 1, 57, 0, 255, 255, 255, 0, 0, 0, 4, 255, 255, 255, 255, 21, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 7, 115, 95, 110, 97, 109, 101, 0,
    0, 0, 0, 1, 0, 0, 0, 0, 5, 99, 111, 100, 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 6, 0, 0, 0, 7, 102,
    95, 110, 97, 109, 101, 0, 0, 0, 0, 1, 0, 0, 0, 0, 5, 99, 111, 100, 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6,
    0, 0, 0, 0, 1, 21, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 2, 88, 0, 0, 0, 0, 6, 77, 105, 120, 101, 100, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 87, 0, 0,
    0, 0, 6, 87, 111, 109, 97, 110, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 77, 0, 0, 0, 0, 4, 77, 97, 110, 0, 0, 0, 0,
    4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 66, 0, 0, 0, 0, 7, 66, 114, 111, 110, 122, 101, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 2, 83, 0, 0, 0, 0, 7, 83, 105, 108, 118, 101, 114, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 71, 0, 0, 0, 0, 5,
    71, 111, 108, 100, 0]));

  var resultSet = executeQueryPacket.parse(packetReader).resultSet;
  assert.equal(resultSet, '{"ColumnNames":["s_name","f_name"],"ColumnDataTypes":["Char","String"],"RowsCount":6,"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"],["B","Bronze"],["S","Silver"],["G","Gold"]]}');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testExecuteQueryPacket_01();

console.log('Unit test ended OK.');

