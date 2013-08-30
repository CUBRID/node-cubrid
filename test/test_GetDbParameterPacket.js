exports['test_GetDbPatameterPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			GetDbParameterPacket = require('../src' + codeCoveragePath + '/packets/GetDbParameterPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			getDbParameterPacket = new GetDbParameterPacket({
				casInfo: [0, 255, 255, 255],
				parameter: CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH
			}),
			packetWriter = new PacketWriter(getDbParameterPacket.getBufferLength());

	test.expect(12);

	getDbParameterPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 9); // Total length
	test.equal(packetWriter._toBuffer()[8], 4);
	test.equal(packetWriter._toBuffer()[12], CAS.CASFunctionCode.CAS_FC_GET_DB_PARAMETER);
	test.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH);

	packetReader.write(new Buffer([0, 0, 0, 0,
		0, 255, 255, 255,
		0, 0, 0, 0,
		0, 0, 0, 99]));
	getDbParameterPacket.parse(packetReader);

	test.equal(getDbParameterPacket.casInfo[0], 0); // Casinfo
	test.equal(getDbParameterPacket.casInfo[1], 255); // Casinfo
	test.equal(getDbParameterPacket.casInfo[2], 255); // Casinfo
	test.equal(getDbParameterPacket.casInfo[3], 255); // Casinfo

	test.equal(getDbParameterPacket.responseCode, 0);
	test.equal(getDbParameterPacket.errorCode, 0);
	test.equal(getDbParameterPacket.errorMsg, '');

	test.equal(getDbParameterPacket.value, 99);
	test.done();
};
