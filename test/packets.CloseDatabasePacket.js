'use strict';

const expect = require('chai').expect;

const PacketReader = require('../src/packets/PacketReader');
const PacketWriter = require('../src/packets/PacketWriter');
const CloseDatabasePacket = require('../src/packets/CloseDatabasePacket');
const CAS = require('../src/constants/CASConstants');

describe('CloseDatabasePacket', function () {
  it('should succeed to verify the return value of write() and parse()', function () {
    const packetReader = new PacketReader();
    const closeDatabasePacket = new CloseDatabasePacket({casInfo: new Buffer([0, 255, 255, 255])});
    const packetWriter = new PacketWriter(closeDatabasePacket.getBufferLength());

    closeDatabasePacket.write(packetWriter);

    const packetWriteBuffer = packetWriter._toBuffer();

    // Total length
    expect(packetWriteBuffer[3]).to.equal(1);
    // CasInfo
    expect(packetWriteBuffer[4]).to.equal(0);
    expect(packetWriteBuffer[5]).to.equal(255);
    expect(packetWriteBuffer[6]).to.equal(255);
    expect(packetWriteBuffer[7]).to.equal(255);

    expect(packetWriteBuffer[8]).to.equal(CAS.CASFunctionCode.CAS_FC_CON_CLOSE);

    packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

    expect(packetReader._packetLength()).to.equal(12);

    closeDatabasePacket.parse(packetReader);

    const casInfo = closeDatabasePacket.casInfo;
    // CasInfo
    expect(casInfo[0]).to.equal(0);
    expect(casInfo[1]).to.equal(255);
    expect(casInfo[2]).to.equal(255);
    expect(casInfo[3]).to.equal(255);

    expect(closeDatabasePacket.responseCode).to.equal(0);
  });
});
