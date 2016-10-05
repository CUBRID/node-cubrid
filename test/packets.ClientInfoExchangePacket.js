'use strict';

const expect = require('chai').expect;

const PacketReader = require('../src/packets/PacketReader');
const PacketWriter = require('../src/packets/PacketWriter');
const ClientInfoExchange = require('../src/packets/ClientInfoExchangePacket');

describe('ClientInfoExchangePacket', function () {
  it('should succeed to verify the return value of write() and parse()', function () {
    const packetReader = new PacketReader();
    const clientInfoExchange = new ClientInfoExchange();
    const packetWriter = new PacketWriter(clientInfoExchange.getBufferLength());

    clientInfoExchange.write(packetWriter);

    expect(packetWriter
        ._toBuffer()
        .toString('utf8', 0, 5)
    )
        .to.equal('CUBRK');

    expect(packetWriter._toBuffer()[5])
        .to.equal(3);

    packetReader.write(new Buffer([0, 0, 1, 2])); //=258
    clientInfoExchange.parse(packetReader);

    expect(clientInfoExchange)
        .to.have.property('newConnectionPort')
        .to.equal(258);
  });
});
