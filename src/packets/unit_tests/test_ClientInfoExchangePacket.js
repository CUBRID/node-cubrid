var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  ClientInfoExchange = require('../ClientInfoExchangePacket'),
  assert = require('assert');

function testClientInfoExchangePacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var clientInfoExchange = new ClientInfoExchange();

  clientInfoExchange.write(packetWriter);
  assert.equal(packetWriter._toBuffer().slice(0, 5), 'CUBRK');
  assert.equal(packetWriter._toBuffer()[5], 3);

  packetReader.write(new Buffer([0, 0, 1, 2])); //=258
  clientInfoExchange.parse(packetReader);
  assert.equal(clientInfoExchange.newConnectionPort, 258);
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testClientInfoExchangePacket_01();

console.log('Unit test ended OK.');

