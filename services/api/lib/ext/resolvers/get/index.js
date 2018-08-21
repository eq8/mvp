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
			const body = _.get(req, 'body') || {};
			const objects = _.get(body, 'objects');
			const batch = _.get(body, 'batch');

			const data = _.map(batch, info => {
				const { trxId, prevPath, config } = info || {};
				const { path } = config || {};

				const obj = _.get(objects, `${trxId}/${prevPath}`);

				return _.get(obj, path) || null;
			});

			console.log('body', JSON.stringify(body, null, ' '));

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
