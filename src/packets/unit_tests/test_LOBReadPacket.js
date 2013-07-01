var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  LOBReadPacket = require('../LOBReadPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testLOBReadPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();

  var packedLobHandle = new Buffer([0, 0, 0, 33, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 79, 102, 105, 108, 101, 58,
                                    67, 58, 92, 67, 85, 66, 82, 73, 68, 92, 100, 97, 116, 97, 98, 97, 115, 101, 115, 92, 100, 101, 109, 111, 100,
                                    98, 47, 108, 111, 98, 47, 99, 101, 115, 95, 48, 56, 50, 47, 116, 101, 115, 116, 95, 108, 111, 98, 46, 48, 48,
                                    48, 48, 49, 51, 54, 49, 57, 55, 54, 53, 52, 50, 48, 48, 48, 48, 48, 48, 95, 56, 49, 52, 53, 0
  ]);
  var lobHandle =
  {
    lobType         : CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, // BLOB type
    packedLobHandle : packedLobHandle,
    fileLocator     : 'file:C:\\CUBRID\\databases\\demodb/lob/ces_670/test_lob.00001361976357078000_1538',
    lobLength       : 4
  };
  var options = {
    casInfo      : [0, 255, 255, 255],
    lobObject    : lobHandle,
    position     : 0,
    lengthToRead : 4,
    dbVersion    : '8.4.1'
  };
  var lobReadPacket = new LOBReadPacket(options);
  lobReadPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 120); // Total length

  assert.equal(packetWriter._toBuffer()[4], 0); // CasInfo
  assert.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_LOB_READ);
  assert.equal(packetWriter._toBuffer()[12], 95);
  for (var i = 0; i < packedLobHandle.length; i++) {
    assert.equal(packetWriter._toBuffer().slice(13, 110)[i], packedLobHandle[i]);
  }
  assert.equal(packetWriter._toBuffer()[111], 8);
  assert.equal(packetWriter._toBuffer()[119], 0);
  assert.equal(packetWriter._toBuffer()[127], 4);

  packetReader.write(new Buffer([0, 0, 0, 15,
                                 0, 255, 255, 255,
                                 0, 0, 0, 4,
                                 1, 2, 3, 4]));
  lobReadPacket.parse(packetReader);

  assert.equal(lobReadPacket.casInfo[0], 0); // CasInfo
  assert.equal(lobReadPacket.casInfo[1], 255); // CasInfo
  assert.equal(lobReadPacket.casInfo[2], 255); // CasInfo
  assert.equal(lobReadPacket.casInfo[3], 255); // CasInfo

  assert.equal(lobReadPacket.responseCode, 4);

  assert.equal(lobReadPacket.errorCode, 0);
  assert.equal(lobReadPacket.errorMsg, '');

  assert.equal(lobReadPacket.lobBuffer[0], 1);
  assert.equal(lobReadPacket.lobBuffer[1], 2);
  assert.equal(lobReadPacket.lobBuffer[2], 3);
  assert.equal(lobReadPacket.lobBuffer[3], 4);
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testLOBReadPacket_01();

console.log('Unit test ended OK.');

