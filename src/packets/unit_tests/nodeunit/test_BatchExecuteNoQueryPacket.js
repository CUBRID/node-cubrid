var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  BatchExecuteNoQueryPacket = require('../../BatchExecuteNoQueryPacket'),
  CAS = require('../../../constants/CASConstants');

exports['test_BatchExecuteNoQueryPacket'] = function (test) {
  console.log('Unit test ' + module.filename.toString() + ' started...');
  test.expect(16);
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {SQLs : ['create table t1(id int)', 'drop table t1'], casInfo : [0, 255, 255, 255],
    autoCommitMode : 1, dbVersion : '8.4.1'};
  var batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket(options);

  batchExecuteNoQueryPacket.write(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 52); //total length

  test.equal(packetWriter._toBuffer()[4], 0); //casInfo
  test.equal(packetWriter._toBuffer()[5], 255); //casInfo
  test.equal(packetWriter._toBuffer()[6], 255); //casInfo
  test.equal(packetWriter._toBuffer()[7], 255); //casInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
  test.equal(packetWriter._toBuffer()[13], 1);
  test.equal(packetWriter._toBuffer().slice(18, 41).toString(), 'create table t1(id int)');
  test.equal(packetWriter._toBuffer().slice(41 + 1 + 4, 59).toString(), 'drop table t1');

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));
  batchExecuteNoQueryPacket.parse(packetReader);

  test.equal(batchExecuteNoQueryPacket.casInfo[0], 0); //casInfo
  test.equal(batchExecuteNoQueryPacket.casInfo[1], 255); //casInfo
  test.equal(batchExecuteNoQueryPacket.casInfo[2], 255); //casInfo
  test.equal(batchExecuteNoQueryPacket.casInfo[3], 255); //casInfo

  test.equal(batchExecuteNoQueryPacket.responseCode, 0);

  test.equal(batchExecuteNoQueryPacket.errorCode, 0);
  test.equal(batchExecuteNoQueryPacket.errorMsg, '');
  console.log('Unit test ended OK.');
  test.done();
};

