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
		logger.trace('commit middleware');

		res.writeHead(200, {
			'Content-Type': 'application/json'
		});

		res.write(JSON.stringify({
			data: {
				success: true
			}
		}));

		res.end();
	}

	return plugin;
});
