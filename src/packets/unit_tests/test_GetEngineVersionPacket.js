var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  GetEngineVersionPacket = require('../GetEngineVersionPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testGetEngineVersionPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255]};
  var getEngineVersionPacket = new GetEngineVersionPacket(options);

  getEngineVersionPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 6); //total length

  assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
  assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_GET_DB_VERSION);
  assert.equal(packetWriter._toBuffer()[12], 1);
  assert.equal(packetWriter._toBuffer()[13], 1);

  packetReader.write(new Buffer([0, 0, 0, 15,
    0, 255, 255, 255,
    0, 0, 0, 0]));
  packetReader._append(new Buffer('8.4.1.0056'));
  packetReader._append(new Buffer([0]));
  getEngineVersionPacket.parse(packetReader);

  assert.equal(getEngineVersionPacket.casInfo[0], 0); //casInfo
  assert.equal(getEngineVersionPacket.casInfo[1], 255); //casInfo
  assert.equal(getEngineVersionPacket.casInfo[2], 255); //casInfo
  assert.equal(getEngineVersionPacket.casInfo[3], 255); //casInfo

  assert.equal(getEngineVersionPacket.responseCode, 0);

  assert.equal(getEngineVersionPacket.errorCode, 0);
  assert.equal(getEngineVersionPacket.errorMsg, '');

  assert.equal(getEngineVersionPacket.engineVersion, '8.4.1.0056');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testGetEngineVersionPacket_01();

console.log('Unit test ended OK.');

