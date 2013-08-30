exports['test_SetDbParameterPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			SetDbParameterPacket = require('../src' + codeCoveragePath + '/packets/SetDbParameterPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants');

	test.expect(13);
	var packetReader = new PacketReader(),
			setDbParameterPacket = new SetDbParameterPacket(	{
				casInfo   : [0, 255, 255, 255],
				parameter : CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH,
				value     : 99
			}),
			packetWriter = new PacketWriter(setDbParameterPacket.getBufferLength());

	setDbParameterPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 17); // Total length
	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
	test.equal(packetWriter._toBuffer()[12], 4);
	test.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH);
	test.equal(packetWriter._toBuffer()[20], 4);
	test.equal(packetWriter._toBuffer()[24], 99);

	packetReader.write(new Buffer([0, 0, 0, 0,
		0, 255, 255, 255,
		0, 0, 0, 0]));
	setDbParameterPacket.parse(packetReader);

	test.equal(setDbParameterPacket.casInfo[0], 0); // Casinfo
	test.equal(setDbParameterPacket.casInfo[1], 255); // Casinfo
	test.equal(setDbParameterPacket.casInfo[2], 255); // Casinfo
	test.equal(setDbParameterPacket.casInfo[3], 255); // Casinfo

	test.equal(setDbParameterPacket.responseCode, 0);
	test.equal(setDbParameterPacket.errorCode, 0);
	test.equal(setDbParameterPacket.errorMsg, '');
	test.done();
};
