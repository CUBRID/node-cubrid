var CUBRIDConnection = require('../src/CUBRIDConnection');

exports.testClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
