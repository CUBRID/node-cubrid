var data = '';

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
	data += chunk;
});

process.stdin.on('end', function() {
	if (data && data.length) {
		var re = /\bSF:/g,
				preparedData = data.replace(re, 'SF:src/');

		console.log(preparedData);
	}
});
