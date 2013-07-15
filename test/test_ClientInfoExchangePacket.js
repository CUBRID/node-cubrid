var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
		PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
		PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
		ClientInfoExchange = require('../src' + codeCoveragePath + '/packets/ClientInfoExchangePacket');

exports['test_clientInfoExchangePacket'] = function (test) {
	test.expect(3);
	var packetReader = new PacketReader();
	var packetWriter = new PacketWriter();
	var clientInfoExchange = new ClientInfoExchange();

	clientInfoExchange.write(packetWriter);
	test.equal(packetWriter._toBuffer().slice(0, 5), 'CUBRK');
	test.equal(packetWriter._toBuffer()[5], 3);

	packetReader.write(new Buffer([0, 0, 1, 2])); //=258
	clientInfoExchange.parse(packetReader);
	test.equal(clientInfoExchange.newConnectionPort, 258);
	test.done();
};
