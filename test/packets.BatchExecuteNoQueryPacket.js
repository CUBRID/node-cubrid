'use strict';

const expect = require('chai').expect;

const BatchExecuteNoQueryPacket = require('../src/packets/BatchExecuteNoQueryPacket');
const PacketReader = require('../src/packets/PacketReader');
const PacketWriter = require('../src/packets/PacketWriter');
const CAS = require('../src/constants/CASConstants');
const ConsoleLogger = require('../src/ConsoleLogger');
const DATA_TYPES = require('../src/constants/DataTypes');

describe('BatchExecuteNoQueryPacket', function () {
  it('should succeed to verify the return value of write() and parse()', function () {
    const packetReader = new PacketReader();
    const autoCommit = 1;
    const protocolVersion = 5;
    const sqls = ['create table t1(id int)', 'drop table t1'];
    const timeout = 0;
    const batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket({
      autoCommit,
      casInfo: new Buffer([0, 255, 255, 255]),
      logger: new ConsoleLogger,
      protocolVersion,
      sqls,
      timeout,
    });
    const packetLength = batchExecuteNoQueryPacket.getBufferLength();
    const packetWriter = new PacketWriter(packetLength);

    batchExecuteNoQueryPacket.write(packetWriter);

    const packetWriterBuffer = packetWriter._toBuffer();

    expect(packetWriterBuffer)
        .to.have.length(packetLength);

    // The content length except the header size.
    expect(packetWriterBuffer[3]).to.equal(packetLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);

    // CasInfo
    expect(packetWriterBuffer[4]).equal(0);
    expect(packetWriterBuffer[5]).equal(255);
    expect(packetWriterBuffer[6]).equal(255);
    expect(packetWriterBuffer[7]).equal(255);

    expect(packetWriterBuffer[8]).equal(CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
    expect(packetWriterBuffer[13]).equal(autoCommit ? 1 : 0);

    let queryStartIndex = 18;

    if (protocolVersion > 4) {
      expect(packetWriterBuffer[14]).to.equal(timeout);
      queryStartIndex += DATA_TYPES.INT_SIZEOF * 2;
    }

    let queryEndIndex = queryStartIndex + sqls[0].length;

    expect(packetWriterBuffer.toString('utf8', queryStartIndex, queryEndIndex)).equal(sqls[0]);

    queryStartIndex =
        queryEndIndex +
        /* null */1 +
        /* the integer length representing the length of the first query */4;
    queryEndIndex = queryStartIndex + sqls[1].length;

    expect(packetWriterBuffer.toString('utf8', queryStartIndex, queryEndIndex)).equal(sqls[1]);
    
    packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));
    batchExecuteNoQueryPacket.parse(packetReader);

    const casInfo = batchExecuteNoQueryPacket.casInfo;

    // CasInfo
    expect(casInfo[0]).to.equal(0);
    expect(casInfo[1]).to.equal(255);
    expect(casInfo[2]).to.equal(255);
    expect(casInfo[3]).to.equal(255);

    expect(batchExecuteNoQueryPacket.responseCode).to.equal(0);
  });
});
