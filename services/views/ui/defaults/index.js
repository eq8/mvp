'use strict';

const http = require('http');

http.createServer((req, res) => {
	const { method, url, headers } = req;
	console.log('req:', { method, url, headers }); // eslint-disable-line no-console

	req.on('data', chunk => console.log(chunk.toString()));

	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write('Hello World!');
	res.end();
}).listen(80);
