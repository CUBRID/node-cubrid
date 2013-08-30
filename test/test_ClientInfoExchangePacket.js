exports['test_clientInfoExchangePacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			ClientInfoExchange = require('../src' + codeCoveragePath + '/packets/ClientInfoExchangePacket'),
			packetReader = new PacketReader(),
			clientInfoExchange = new ClientInfoExchange(),
			packetWriter = new PacketWriter(clientInfoExchange.getBufferLength());

	test.expect(3);

	clientInfoExchange.write(packetWriter);
	test.equal(packetWriter._toBuffer().slice(0, 5), 'CUBRK');
	test.equal(packetWriter._toBuffer()[5], 3);

	packetReader.write(new Buffer([0, 0, 1, 2])); //=258
	clientInfoExchange.parse(packetReader);
	test.equal(clientInfoExchange.newConnectionPort, 258);
	test.done();
};
