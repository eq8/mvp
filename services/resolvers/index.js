'use strict';

const path = require('path');
const define = require('@eq8/mvp-boot')({
	extensions: path.join(__dirname, './lib/ext')
});

define([
	'lodash',
	'body-parser',
	'-/options/index.js',
	'-/logger/index.js',
	'-/server/index.js',
	'-/ext/utils/get/index.js'
], (_, bodyParser, options, logger, server, get) => {
	const defaults = {
		port: 8000
	};
	const { port } = _.defaultsDeep(options.get(), defaults);

	server.use(bodyParser.json());
	server.use('/utils/get/0.0', get.middleware());

	server.listen({ port }).then(success => {
		logger.info('server is listening', { port, success });
		server.setState('ready');
	}, err => {
		throw new Error(err);
	});
});
