'use strict';

const http = require('http');
const express = require('express');
const app = express();
const _ = require('lodash');

app.use(express.json());
app.use('/0.0', (req, res) => {
	const path = _.get(req, 'query.path');
	const body = _.get(req, 'body') || {};
	const data = _.get(body, `obj[${path}]`);

	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.write(JSON.stringify({ data }));
	res.end();
});

http.createServer(app).listen(process.env.PORT || 80);
