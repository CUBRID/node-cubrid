var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  GetSchemaPacket = require('../../GetSchemaPacket.js'),
  CAS = require('../../../constants/CASConstants');

exports['test_GetSchemaPacket'] = function (test) {
  test.expect(29);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {
    casInfo          : [0, 255, 255, 255],
    tableNamePattern : null,
    schemaType       : CAS.CUBRIDSchemaType.CCI_SCH_CLASS,
    dbVersion        : '8.4.1'};
  var getSchemaPacket = new GetSchemaPacket(options);

  getSchemaPacket.writeRequestSchema(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 1 + 5 * 4 + 1); //total length

  test.equal(packetWriter._toBuffer()[4], 0); //casInfo
  test.equal(packetWriter._toBuffer()[5], 255); //casInfo
  test.equal(packetWriter._toBuffer()[6], 255); //casInfo
  test.equal(packetWriter._toBuffer()[7], 255); //casInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SCHEMA_INFO);
  test.equal(packetWriter._toBuffer()[16], CAS.CUBRIDSchemaType.CCI_SCH_CLASS);
  test.equal(packetWriter._toBuffer()[21], 0);
  test.equal(packetWriter._toBuffer()[28], 1);
  test.equal(packetWriter._toBuffer()[29], 3);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 1]));

  test.equal(packetReader._packetLength(), 12);

  getSchemaPacket.parseRequestSchema(packetReader);

  test.equal(getSchemaPacket.casInfo[0], 0); //casInfo
  test.equal(getSchemaPacket.casInfo[1], 255); //casInfo
  test.equal(getSchemaPacket.casInfo[2], 255); //casInfo
  test.equal(getSchemaPacket.casInfo[3], 255); //casInfo

  test.equal(getSchemaPacket.responseCode, 1);

  test.equal(getSchemaPacket.errorCode, 0);
  test.equal(getSchemaPacket.errorMsg, '');

  packetWriter = new PacketWriter();
  getSchemaPacket.writeFetchSchema(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 38); //total length

  test.equal(packetWriter._toBuffer()[4], 0); //casInfo
  test.equal(packetWriter._toBuffer()[5], 255); //casInfo
  test.equal(packetWriter._toBuffer()[6], 255); //casInfo
  test.equal(packetWriter._toBuffer()[7], 255); //casInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_FETCH);
  test.equal(packetWriter._toBuffer()[16], 1);
  test.equal(packetWriter._toBuffer()[24], 1);
  test.equal(packetWriter._toBuffer()[32], 0);
  test.equal(packetWriter._toBuffer()[37], 0);
  test.equal(packetWriter._toBuffer()[45], 0);
  console.log('Unit test ended OK.');
  test.done();
};
