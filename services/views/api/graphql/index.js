'use strict';

const path = require('path');
const boot = require('@eq8/mvp-boot');

const define = boot({
	extensions: path.join(__dirname, './lib/ext')
});

define([
	'lodash',
	'-/options/index.js',
	'-/logger/index.js',
	'-/store/index.js',
	'-/server/index.js',
	'-/ext/api/index.js'
], (_, options, logger, store, server, api) => {
	logger.info('initialized');

	const defaults = {
		port: 80,
		storeUri: 'rethinkdb://admin@127.0.0.1:28015',
		retryInterval: 1000
	}
	const settings = _.defaults(options.get(), defaults);
	const port = parseInt(_.get(settings, 'port'), 10);
	const storeUri = _.get(settings, 'storeUri');
	const retryInterval = parseInt(options.get('retryInterval'), 10);

	server.use('/:bctxt/:aggregate/:v', api.middleware());

	listen().then(connect);

	async function listen() {
		try {
			const { success } = await server.listen({ port }) || {};

			logger.info('server is listening', { port, success });
		} catch (err) {
			logger.error('server unable to listen', { port, err });
			process.exitCode = 1;
		}
	}

	async function connect() {
		try {
			const { success } = await store.connect({ storeUri }) || {};

			logger.info('store has connected', { storeUri, success });

			server.setState('ready'); // TODO: replace with connected, ready if db was created
		} catch (err) {
			logger.error('store unable to connect', { storeUri, err });
			setTimeout(connect, retryInterval);
		}
	}
});
