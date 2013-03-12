var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  GetSchemaPacket = require('../GetSchemaPacket.js'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function test_GetSchemaPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {
    casInfo          : [0, 255, 255, 255],
    tableNamePattern : null,
    schemaType       : CAS.CUBRIDSchemaType.CCI_SCH_CLASS,
    dbVersion        : '8.4.1'};
  var getSchemaPacket = new GetSchemaPacket(options);

  getSchemaPacket.writeRequestSchema(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 1 + 5 * 4 + 1); //total length

  assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
  assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SCHEMA_INFO);
  assert.equal(packetWriter._toBuffer()[16], CAS.CUBRIDSchemaType.CCI_SCH_CLASS);
  assert.equal(packetWriter._toBuffer()[21], 0);
  assert.equal(packetWriter._toBuffer()[28], 1);
  assert.equal(packetWriter._toBuffer()[29], 3);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 1]));

  assert.equal(packetReader._packetLength(), 12);

  getSchemaPacket.parseRequestSchema(packetReader);

  assert.equal(getSchemaPacket.casInfo[0], 0); //casInfo
  assert.equal(getSchemaPacket.casInfo[1], 255); //casInfo
  assert.equal(getSchemaPacket.casInfo[2], 255); //casInfo
  assert.equal(getSchemaPacket.casInfo[3], 255); //casInfo

  assert.equal(getSchemaPacket.responseCode, 1);

  assert.equal(getSchemaPacket.errorCode, 0);
  assert.equal(getSchemaPacket.errorMsg, '');

  packetWriter = new PacketWriter();
  getSchemaPacket.writeFetchSchema(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 38); //total length

  assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
  assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_FETCH);
  assert.equal(packetWriter._toBuffer()[16], 1);
  assert.equal(packetWriter._toBuffer()[24], 1);
  assert.equal(packetWriter._toBuffer()[32], 0);
  assert.equal(packetWriter._toBuffer()[37], 0);
  assert.equal(packetWriter._toBuffer()[45], 0);
}

console.log('Unit test ' + module.filename.toString() + ' started...');

test_GetSchemaPacket_01();

console.log('Unit test ended OK.');
