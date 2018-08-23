/* global define */
'use strict';

define([
	'lodash',
	'body-parser',
	'-/options/index.js',
	'-/logger/index.js',
	'-/server/index.js',
	'-/store/index.js',
	'-/ext/rethinkdb/queries/read/index.js',
	'-/ext/rethinkdb/queries/browse/index.js',
	'-/ext/rethinkdb/actions/commit/index.js'
], (_, bodyParser, options, logger, server, store, read, browse, commit) => {
	const defaults = {
		port: 8000,
		retryInterval: 1000
	};
	const { port, storeUri, retryInterval } = _.defaultsDeep(options.get(), defaults);

	const plugin = { start };

	function start() {
		listen().then(connect, err => {
			throw new Error(err);
		});
	}

	async function listen() {
		try {
			server.use(bodyParser.json());
			server.use('/queries/read/0.0', read.middleware());
			server.use('/queries/browse/0.0', browse.middleware());
			server.use('/actions/commit/0.0', commit.middleware());

			const { success } = await server.listen(port) || {};

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

	return plugin;
});
