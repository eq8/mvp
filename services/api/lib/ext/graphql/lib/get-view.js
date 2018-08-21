/* globals define */
'use strict';

define([
	'-/ext/graphql/lib/get-config.js',
	'-/ext/graphql/lib/get-aggregate.js',
	'-/ext/graphql/lib/get-repository.js',
	'-/ext/graphql/lib/get-api.js'
], (
	getConfig,
	getAggregate,
	getRepository,
	getAPI
) => async function getView(args) {
	const config = await getConfig(args);
	const aggregate = getAggregate(config, args);
	const repository = getRepository(config, aggregate);

	return getAPI({
		aggregate,
		repository
	});
});
