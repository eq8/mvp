'use strict';

const path = require('path');
const rjs = require('requirejs');


const map = {
	'*': {
		'-': path.join(__dirname, './plugins')
	}
};

rjs.config({ map });

rjs([
	'-/logger/index.js',
	'-/store/index.js',
	'-/server/index.js'
], (logger, store, server) => {
	logger.info('initialized');

	const port = parseInt(process.env.PORT || 80, 10);
	const storeUri = process.env.STORE_URI || 'rethinkdb://admin@127.0.0.1:28015';
	const retryInterval = parseInt(process.env.RETRY_INTERVAL || 1000, 10);

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
