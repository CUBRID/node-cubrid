function testSetAutoCommitModePacket_01() {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			SetAutoCommitModePacket = require('../src' + codeCoveragePath + '/packets/SetAutoCommitModePacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			assert = require('assert');

	var packetReader = new PacketReader();
	var packetWriter = new PacketWriter();
	var options = {casInfo : [0, 255, 255, 255], autoCommitMode : 1};
	var setAutoCommitModePacket = new SetAutoCommitModePacket(options);

	setAutoCommitModePacket.write(packetWriter);
	assert.equal(packetWriter._toBuffer()[3], 1 + 4 * 4); //total length

	assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
	assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
	assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
	assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

	assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
	assert.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_AUTO_COMMIT);
	assert.equal(packetWriter._toBuffer()[20], 4);
	assert.equal(packetWriter._toBuffer()[24], 1);

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

	assert.equal(packetReader._packetLength(), 12);

	setAutoCommitModePacket.parse(packetReader);

	assert.equal(setAutoCommitModePacket.casInfo[0], 0); //casInfo
	assert.equal(setAutoCommitModePacket.casInfo[1], 255); //casInfo
	assert.equal(setAutoCommitModePacket.casInfo[2], 255); //casInfo
	assert.equal(setAutoCommitModePacket.casInfo[3], 255); //casInfo

	assert.equal(setAutoCommitModePacket.responseCode, 0);

	assert.equal(setAutoCommitModePacket.errorCode, 0);
	assert.equal(setAutoCommitModePacket.errorMsg, '');
}

testSetAutoCommitModePacket_01();
