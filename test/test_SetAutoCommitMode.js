var path = require('path');

exports[path.basename(__filename)] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			SetAutoCommitModePacket = require('../src' + codeCoveragePath + '/packets/SetAutoCommitModePacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants');

	var packetReader = new PacketReader(),
			setAutoCommitModePacket = new SetAutoCommitModePacket({casInfo : [0, 255, 255, 255], autoCommitMode : 1}),
			packetWriter = new PacketWriter(setAutoCommitModePacket.getBufferLength());

	setAutoCommitModePacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 1 + 4 * 4); //total length

	test.equal(packetWriter._toBuffer()[4], 0); //casInfo
	test.equal(packetWriter._toBuffer()[5], 255); //casInfo
	test.equal(packetWriter._toBuffer()[6], 255); //casInfo
	test.equal(packetWriter._toBuffer()[7], 255); //casInfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
	test.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_AUTO_COMMIT);
	test.equal(packetWriter._toBuffer()[20], 4);
	test.equal(packetWriter._toBuffer()[24], 1);

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

	test.equal(packetReader._packetLength(), 12);

	setAutoCommitModePacket.parse(packetReader);

	test.equal(setAutoCommitModePacket.casInfo[0], 0); //casInfo
	test.equal(setAutoCommitModePacket.casInfo[1], 255); //casInfo
	test.equal(setAutoCommitModePacket.casInfo[2], 255); //casInfo
	test.equal(setAutoCommitModePacket.casInfo[3], 255); //casInfo

	test.equal(setAutoCommitModePacket.responseCode, 0);

	test.equal(setAutoCommitModePacket.errorCode, 0);
	test.equal(setAutoCommitModePacket.errorMsg, '');
	test.done();
};
