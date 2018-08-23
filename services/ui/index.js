'use strict';

const define = require('@eq8/mvp-boot')();
const path = require('path');

define([
	'lodash',
	'express',
	'-/options/index.js',
	'-/logger/index.js',
	'-/server/index.js'
], (_, express, options, logger, server) => {
	const defaults = {
		port: 80
	};
	const { port } = _.defaultsDeep({}, options.get(), defaults);

	server.use('/', express.static(path.join(__dirname, './static/build')));

	server.listen(port).then(success => {
		logger.info('server is listening', { port, success });
		server.setState('ready');
	}, err => {
		throw new Error(err);
	});
});
