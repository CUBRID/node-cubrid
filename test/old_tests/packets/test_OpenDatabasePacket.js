var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  OpenDatabasePacket = require('../OpenDatabasePacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testLoginToDatabasePacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {database : 'demodb', user : 'public', password : ''};
  var openDatabasePacket = new OpenDatabasePacket(options);

  openDatabasePacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer().slice(0, 6).toString(), options.database);
  assert.equal(packetWriter._toBuffer().slice(32, 38).toString(), options.user);
  assert.equal(packetWriter._toBuffer().slice(64, 65)[0], 0);

  packetReader.write(new Buffer([0, 0, 0, 15,
    0, 255, 255, 255,
    0, 0, 0, 0,
    5, 5, 5, 5, 5, 5, 5, 5,
    0, 0, 0, 3]));
  openDatabasePacket.parse(packetReader);

  assert.equal(openDatabasePacket.casInfo[0], 0); // CasInfo
  assert.equal(openDatabasePacket.casInfo[1], 255); // CasInfo
  assert.equal(openDatabasePacket.casInfo[2], 255); // CasInfo
  assert.equal(openDatabasePacket.casInfo[3], 255); // CasInfo

  assert.equal(openDatabasePacket.responseCode, 0);

  assert.equal(openDatabasePacket.errorCode, 0);
  assert.equal(openDatabasePacket.errorMsg, '');

  assert.equal(openDatabasePacket.brokerInfo[0], 5);
  assert.equal(openDatabasePacket.sessionId, 3);
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testLoginToDatabasePacket_01();

console.log('Unit test ended OK.');

