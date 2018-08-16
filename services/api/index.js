'use strict';

const path = require('path');
const boot = require('@eq8/mvp-boot');

const define = boot({
	extensions: path.join(__dirname, './lib/ext')
});

define([
	'lodash',
	'body-parser',
	'fs',
	'cluster',
	'os',
	'-/options/index.js',
	'-/logger/index.js',
	'-/store/index.js',
	'-/server/index.js',
	'-/ext/api/index.js',
	'-/ext/resolvers/get/index.js'
], (_, bodyParser, fs, cluster, os, options, logger, store, server, api, get) => {
	logger.info('initialized');

	const defaults = {
		port: 80,
		storeUri: 'rethinkdb://admin@127.0.0.1:28015',
		retryInterval: 1000
	};
	const settings = _.defaults(options.get(), defaults);
	const socketPath = '/var/run/resolvers.sock';

	if (cluster.isMaster) {
		server.use('/:bctxt/:aggregate/:v', api.middleware());

		fork().then(startMaster).then(connect);
	} else {
		server.use(bodyParser.json());
		server.use('/get/0.0', get.middleware());

		server.setState('ready');
		server.listen({ port: socketPath });
	}

	async function fork() {
		const CPUs = os.cpus().length;

		logger.info('fork', { CPUs });

		try {
			fs.unlinkSync(socketPath);
		} catch (err) {
			logger.warn('api unable to unlink socket file', { err });
		}

		for (let i = 0; i < (2 * CPUs); i++) {
			cluster.fork();
		}
	}

	async function startMaster() {
		const port = parseInt(_.get(settings, 'port'), 10);

		try {
			const { success } = await server.listen({ port }) || {};

			logger.info('server is listening', { port, success });
		} catch (err) {
			logger.error('server unable to listen', { port, err });
			process.exitCode = 1;
		}
	}

	async function connect() {
		const storeUri = _.get(settings, 'storeUri');
		const retryInterval = parseInt(options.get('retryInterval'), 10);

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
