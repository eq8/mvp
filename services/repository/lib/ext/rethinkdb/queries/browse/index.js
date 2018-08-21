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

		const results = [];

		for (let i = 0; i < 1000; i++) {
			const current = new Date();

			results.push({
				id: `127.0.0.${i}`,
				version: 1,
				meta: {
					created: current.toISOString(),
					lastModified: current.toISOString()
				},
				repository: {
					name: 'default'
				}
			});
		}

		res.writeHead(200, {
			'Content-Type': 'application/json'
		});
		res.write(JSON.stringify({
			data: [results]
		}));

		res.end();
	}

	return plugin;
});
