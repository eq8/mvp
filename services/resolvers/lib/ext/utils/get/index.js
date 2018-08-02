/* global define */
'use strict';

define([
	'lodash',
	'-/logger/index.js'
], (_, logger) => {
	const plugin = {
		middleware() {
			return middleware;
		}
	};

	function middleware(req, res) {
		try {
			const path = _.get(req, 'query.path');
			const body = _.get(req, 'body') || {};
			const data = _.get(body, `obj[${path}]`);

			logger.trace('get middleware', { path });

			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.write(JSON.stringify({ data }));
			res.end();
		} catch (err) {
			logger.error('get unable to resolve', { err });
		}
	}

	return plugin;
});
