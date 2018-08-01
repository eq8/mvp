'use strict';

const define = require('@eq8/mvp-boot');

define([
	'-/options/index.js',
	'-/logger/index.js',
	'-/server/index.js'
], (options, logger, server) => {
	const defaults = {
		port: 80
	};
	const settings = _.defaultsDeep(options.get(), defaults)
	const { port } = settings;

	server.use((req, res) => {
		const { method, url, headers } = req;

		logger.info('req:', { method, url, headers });

		req.on('data', chunk => logger.info(chunk.toString()));

		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.write('Hello World!');
		res.end();
	});

	server.listen(port);
});
