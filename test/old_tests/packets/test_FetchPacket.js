var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  ExecuteQueryPacket = require('../ExecuteQueryPacket'),
  FetchPacket = require('../FetchPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testFetchPacket() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options =
  {
    casInfo   : [0, 255, 255, 255],
    dbVersion : '8.4.1'
  };

  packetReader = new PacketReader();
  packetWriter = new PacketWriter();
  options = {sql : 'select * from code', casInfo : [0, 255, 255, 255], autoCommitMode : 1, dbVersion : '8.4.1'};
  var executeQueryPacket = new ExecuteQueryPacket(options);
  executeQueryPacket.write(packetWriter);
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

  packetReader = new PacketReader();
  packetWriter = new PacketWriter();
  var fetchPacket = new FetchPacket(options);
  fetchPacket.write(packetWriter, executeQueryPacket);
  assert.equal(packetWriter._toBuffer()[3], 38); // Total length
  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_FETCH);
  assert.equal(packetWriter._toBuffer()[16], 4);
  assert.equal(packetWriter._toBuffer()[24], 7);
  assert.equal(packetWriter._toBuffer()[32], 100);
  assert.equal(packetWriter._toBuffer()[37], 0);
  assert.equal(packetWriter._toBuffer()[45], 0);

  packetReader.write(new Buffer([0, 0, 0, 0,
                                 0, 255, 255, 255,
                                 0, 0, 0, 0,
                                 0, 0, 0, 0]));
  fetchPacket.parse(packetReader, executeQueryPacket);

  assert.equal(fetchPacket.casInfo[0], 0); // CasInfo
  assert.equal(fetchPacket.casInfo[1], 255); // CasInfo
  assert.equal(fetchPacket.casInfo[2], 255); // CasInfo
  assert.equal(fetchPacket.casInfo[3], 255); // CasInfo

  assert.equal(fetchPacket.responseCode, 0);
  assert.equal(fetchPacket.errorCode, 0);
  assert.equal(fetchPacket.errorMsg, '');

  assert.equal(fetchPacket.tupleCount, 0);
}

console.log('Unit test ' + module.filename.toString() + ' started...');
testFetchPacket();
console.log('Unit test ended OK.');
