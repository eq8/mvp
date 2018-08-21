/* globals define */
'use strict';

const ERROR_AGGREGATE_NOT_FOUND = 'Aggregate was not found';
const ERROR_REPOSITORY_NOT_FOUND = 'Repository was not found';

define([
	'lodash',
	'-/logger/index.js',
	'graphql-tools',
	'express-graphql',
	'-/ext/graphql/lib/get-queries.js',
	'-/ext/graphql/lib/get-methods.js',
	'-/ext/graphql/lib/get-actions.js',
	'-/ext/graphql/lib/get-entities.js',
	'-/ext/graphql/lib/get-input-entities.js',
	'-/ext/graphql/lib/get-type-defs.js',
	'-/ext/graphql/lib/get-resolvers.js'
], (
	_,
	logger,
	{ makeExecutableSchema },
	graphqlHTTP,
	getQueries,
	getMethods,
	getActions,
	getEntities,
	getInputEntities,
	getTypeDefs,
	getResolvers
) => function getAPI(args) {
	const { aggregate, repository } = args || {};

	if (!aggregate) {
		logger.error(ERROR_AGGREGATE_NOT_FOUND);
		throw new Error(ERROR_AGGREGATE_NOT_FOUND);
	}

	if (!repository) {
		logger.error(ERROR_REPOSITORY_NOT_FOUND);
		throw new Error(ERROR_REPOSITORY_NOT_FOUND);
	}

	const queries = getQueries(aggregate);
	const methods = getMethods(aggregate);
	const actions = getActions(aggregate);
	const entities = getEntities(aggregate);
	const inputEntities = getInputEntities(aggregate);
	const definitions = {
		queries,
		methods,
		actions,
		entities,
		inputEntities,
		repository
	};
	const typeDefs = getTypeDefs(definitions);
	const resolvers = getResolvers(definitions);

	const schema = makeExecutableSchema({
		logger: {
			log: resolveError => logger.error('api unable to resolve', { err: resolveError })
		},
		typeDefs,
		resolvers
	});

	const API = graphqlHTTP({
		schema,
		rootValue: {},
		graphiql: true
	});

	return API;
});
