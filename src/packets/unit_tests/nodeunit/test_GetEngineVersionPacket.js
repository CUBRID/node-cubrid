var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  GetEngineVersionPacket = require('../../GetEngineVersionPacket'),
  CAS = require('../../../constants/CASConstants');

exports['test_GetEngineVersionPacket'] = function (test) {
  test.expect(16);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255]};
  var getEngineVersionPacket = new GetEngineVersionPacket(options);

  getEngineVersionPacket.write(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 6); //total length

  test.equal(packetWriter._toBuffer()[4], 0); //casInfo
  test.equal(packetWriter._toBuffer()[5], 255); //casInfo
  test.equal(packetWriter._toBuffer()[6], 255); //casInfo
  test.equal(packetWriter._toBuffer()[7], 255); //casInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_GET_DB_VERSION);
  test.equal(packetWriter._toBuffer()[12], 1);
  test.equal(packetWriter._toBuffer()[13], 1);

  packetReader.write(new Buffer([0, 0, 0, 15,
                                 0, 255, 255, 255,
                                 0, 0, 0, 0]));
  packetReader._append(new Buffer('8.4.1.0056'));
  packetReader._append(new Buffer([0]));
  getEngineVersionPacket.parse(packetReader);

  test.equal(getEngineVersionPacket.casInfo[0], 0); //casInfo
  test.equal(getEngineVersionPacket.casInfo[1], 255); //casInfo
  test.equal(getEngineVersionPacket.casInfo[2], 255); //casInfo
  test.equal(getEngineVersionPacket.casInfo[3], 255); //casInfo

  test.equal(getEngineVersionPacket.responseCode, 0);

  test.equal(getEngineVersionPacket.errorCode, 0);
  test.equal(getEngineVersionPacket.errorMsg, '');

  test.equal(getEngineVersionPacket.engineVersion, '8.4.1.0056');
  console.log('Unit test ended OK.');
  test.done();
};

