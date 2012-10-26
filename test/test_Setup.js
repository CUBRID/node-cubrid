var CUBRIDConnection = require('../src/CUBRIDConnection');
exports.createDefaultCUBRIDDemodbConnection = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
