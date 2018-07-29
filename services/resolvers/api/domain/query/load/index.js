'use strict';

const http = require('http');
const app = require('connect')();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const current = new Date();

app.use('/0.0', (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.write(JSON.stringify({
		data: [{
			id: '127.0.0.1:8000',
			version: 1,
			meta: {
				created: current.toISOString(),
				lastModified: current.toISOString()
			},
			repository: {
				name: 'default'
			}
		}]
	}));
	res.end();
});

http.createServer(app).listen(process.env.PORT || 80);
