/* globals define */
'use strict';

define([
	'lodash',
	'lru-cache',
	'uuid/v4',
	'-/logger/index.js',
	'-/options/index.js',
	'-/ext/graphql/lib/get-view.js'
], (_, lru, uuid, logger, options, getView) => {
	const max = parseInt(options.get('maxAggregateCache') || 1024, 10);
	const cache = lru({ max });

	const plugin = {
		middleware() {
			return (req, res, next) => {
				const domain = _.get(req, 'headers.host');
				const bctxt = _.get(req, 'params.bctxt');
				const aggregate = _.get(req, 'params.aggregate');
				const v = _.get(req, 'params.v');

				const uri = `${domain}/${bctxt}/${aggregate}/${v}`;

				logger.debug('uri', { uri });

				const cached = cache.get(uri);

				req.trxId = uuid();

				if (cached) {
					logger.trace(`using cached middleware for ${uri}`);

					cached(req, res, next);
				} else {
					logger.trace(`loading middleware for ${uri}`);

					getView({
						domain, bctxt, aggregate, v
					}).then(middleware => {
						logger.trace('middleware found');
						cache.set(uri, middleware);
						middleware(req, res, next);
					}, next);
				}
			};
		}
	};

	return plugin;
});

