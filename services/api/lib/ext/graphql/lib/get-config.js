/* globals define */
'use strict';

define([
	'lodash',
	'-/logger/index.js',
	'-/store/index.js'
], (
	_,
	logger,
	store
) => async function getConfig(args) {
	const domain = _.get(args, 'domain');
	const bctxt = _.get(args, 'bctxt');
	const id = `${domain}/${bctxt}`;

	logger.trace(`reading bounded context info for ${id}`);

	const config = await store.read({
		type: 'boundedContexts',
		id
	});

	logger.debug('config', { config });

	return config;
});
