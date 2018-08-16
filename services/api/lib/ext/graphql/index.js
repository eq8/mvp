/* globals define */
'use strict';

define([
	'lodash',
	'lru-cache',
	'-/logger/index.js',
	'-/ext/graphql/utils.js'
], (_, lru, logger, utils) => {
	const max = !_.isNaN(parseInt(process.env.MVP_API_LRU_MAXSIZE, 10))
		? parseInt(process.env.MVP_API_LRU_MAXSIZE, 10)
		: 500;
	const maxAge = !_.isNaN(parseInt(process.env.MVP_API_LRU_MAXAGE, 10))
		? parseInt(process.env.MVP_API_LRU_MAXAGE, 10)
		: 1000 * 60 * 60;
	const cache = lru({
		max,
		maxAge
	});

	const {
		getView
	} = utils;

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

