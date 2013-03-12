var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  BatchExecuteNoQueryPacket = require('../BatchExecuteNoQueryPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testBatchExecuteNoQueryPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {SQLs : ['create table t1(id int)', 'drop table t1'],
    casInfo : [0, 255, 255, 255], autoCommitMode : 1, dbVersion : '8.4.1'};
  var batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket(options);

  batchExecuteNoQueryPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 52); //total length

  assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
  assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
  assert.equal(packetWriter._toBuffer()[13], 1);
  assert.equal(packetWriter._toBuffer().slice(18, 41).toString(), 'create table t1(id int)');
  assert.equal(packetWriter._toBuffer().slice(41 + 1 + 4, 59).toString(), 'drop table t1');

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));
  batchExecuteNoQueryPacket.parse(packetReader);

  assert.equal(batchExecuteNoQueryPacket.casInfo[0], 0); //casInfo
  assert.equal(batchExecuteNoQueryPacket.casInfo[1], 255); //casInfo
  assert.equal(batchExecuteNoQueryPacket.casInfo[2], 255); //casInfo
  assert.equal(batchExecuteNoQueryPacket.casInfo[3], 255); //casInfo

  assert.equal(batchExecuteNoQueryPacket.responseCode, 0);

  assert.equal(batchExecuteNoQueryPacket.errorCode, 0);
  assert.equal(batchExecuteNoQueryPacket.errorMsg, '');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testBatchExecuteNoQueryPacket_01();

console.log('Unit test ended OK.');

