/* global define */
'use strict';

define([
	'-/logger/index.js'
], logger => {
	const plugin = {
		middleware() {
			return middleware;
		}
	};

	function middleware(req, res) {
		logger.trace('read middleware');

		const current = new Date();

		const result = [{
			id: '127.0.0.1',
			version: 1,
			meta: {
				created: current.toISOString(),
				lastModified: current.toISOString()
			},
			repository: {
				name: 'default'
			}
		}];

		res.writeHead(200, {
			'Content-Type': 'application/json'
		});
		res.write(JSON.stringify({
			data: [result]
		}));

		res.end();
	}

	return plugin;
});
