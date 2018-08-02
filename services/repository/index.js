'use strict';

const path = require('path');
const define = require('@eq8/mvp-boot')({
	extensions: path.join(__dirname, './lib/ext')
});

define([
	'lodash',
	'-/options/index.js',
	'-/logger/index.js',
	'-/server/index.js',
	'-/store/index.js',
	'-/ext/rethinkdb/queries/read/index.js'
], (_, options, logger, server, store, read) => {
	const defaults = {
		port: 8000,
		retryInterval: 1000
	};
	const { port, storeUri, retryInterval } = _.defaultsDeep(options.get(), defaults);

	listen().then(connect, err => {
		throw new Error(err);
	});

	async function listen() {
		try {
			server.use('/queries/read/0.0', read.middleware());

			// server.use('/queries/commit/0.0', commit.middleware());

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
