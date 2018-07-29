/* global define */
'use strict';


define([
	'-/logger/index.js'
], logger => {
	let state = 'disconnected';

	return {
		middleware() {
			return (req, res, next) => {
				switch (state) {
				case 'ready':
					return next();
				default:
					return res.status(503).end();
				}
			};
		},
		setState(newState) {
			state = newState;

			logger.info('server has changed state', { state });
		}
	};
});
