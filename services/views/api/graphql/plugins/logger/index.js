/* global define */
'use strict';

define(['winston'], winston => {
	const plugin = winston.createLogger({
		levels: {
			trace: 5, debug: 4, info: 3, warn: 2, error: 1, fatal: 0
		},
		transports: [
			new (winston.transports.Console)({
				level: process.env.MVP_LOGGER_LEVEL || 'info',
				timestamp: () => (new Date()).toISOString(),
				colorize: true
			})
		]
	});

	return plugin;
});
