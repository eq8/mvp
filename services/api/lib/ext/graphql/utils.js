/* globals define, Promise */
'use strict';

define([
	'lodash',
	'immutable',
	'graphql-tools',
	'express-graphql',
	'request',
	'-/logger/index.js',
	'-/store/index.js',
	'-/ext/utils/index.js'
], (
	_,
	{ Map, List },
	{ makeExecutableSchema },
	graphqlHTTP,
	request,
	logger,
	store,
	{ toImmutable }
) => {
	const plugin = {
		getView
	};

	const LF = '\n';
	const PROPERTIES = {
		QUERIES: 'queries',
		METHODS: 'methods',
		ACTIONS: 'actions',
		ENTITIES: 'entities',
		INPUT_ENTITIES: 'inputEntities',
		REPOSITORY: 'repository'
	};

	async function getView(args) {
		const config = await getConfig(args);
		const aggregate = getAggregate(config, args);
		const repository = getRepository(config, aggregate);

		return getAPI({
			aggregate,
			repository
		});
	}

	async function getConfig(args) {
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
	}

	function getAggregate(config, args) {
		const { aggregate, v } = args || {};

		const aggregatePath = `aggregates['${aggregate}'].versions['${v}']`;

		logger.debug('aggregatePath', { aggregatePath });

		return _.get(config, aggregatePath);
	}

	function getAPI(args) {
		const { aggregate, repository } = args || {};

		if (!aggregate) {
			const ERROR_AGGREGATE_NOT_FOUND = 'Aggregate was not found';

			logger.error(ERROR_AGGREGATE_NOT_FOUND);
			throw new Error(ERROR_AGGREGATE_NOT_FOUND);
		}

		if (!repository) {
			const ERROR_REPOSITORY_NOT_FOUND = 'Repository was not found';

			logger.error(ERROR_REPOSITORY_NOT_FOUND);
			throw new Error(ERROR_REPOSITORY_NOT_FOUND);
		}

		const queries = getQueries(aggregate);
		const methods = getMethods(aggregate);
		const actions = getActions(aggregate);
		const entities = getEntities(aggregate);
		const inputEntities = getInputEntities(aggregate);
		const typeDefsRaw = {
			queries,
			methods,
			actions,
			entities,
			inputEntities,
			repository
		};
		const typeDefs = getTypeDefs(typeDefsRaw);
		const resolvers = getResolvers(typeDefsRaw);

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
	}

	function getQueries(aggregate) {
		const queries = _.get(aggregate, PROPERTIES.QUERIES) || {};

		return _.mapValues(
			queries,

			// safe-assign: all queries returns a collection of `Aggregate`'s
			query => _.assign({}, query, { returnType: { name: 'Aggregate', isCollection: true } })
		);
	}

	function getMethods(aggregate) {
		const methods = _.get(aggregate, PROPERTIES.METHODS) || {};
		const hasReturnType = _.unary(_.partialRight(_.has, 'returnType'));

		return _.pickBy(methods, hasReturnType);
	}

	function getActions(aggregate) {
		const actions = _.get(aggregate, PROPERTIES.ACTIONS) || {};

		return _.mapValues(
			actions,

			// safe-assign: all actions return a `Transaction` object
			action => _.assign({}, action, { returnType: { name: 'Transaction' } })
		);
	}

	function getEntities(aggregate) {
		const entities = _.get(aggregate, PROPERTIES.ENTITIES) || {};

		// const hasName = _.partialRight(_.has, 'methods');

		return entities; // _.pickBy(entities, hasName);
	}

	function getInputEntities(aggregate) {
		const entities = _.get(aggregate, PROPERTIES.INPUT_ENTITIES) || {};

		// const hasName = _.partialRight(_.has, 'methods');

		return entities; // _.pickBy(entities, hasName);
	}

	function getRepository(config, aggregate) {
		const repositoryName = _.get(aggregate, PROPERTIES.REPOSITORY);
		const repositoryPath = `repositories['${repositoryName}']`;
		const repository = _.get(config, repositoryPath);

		logger.debug('repositoryPath', { repositoryPath });
		logger.debug('repository', { repository });

		return repository;
	}

	function getTypeDefs(args) {
		const { queries, methods, actions, entities, inputEntities } = args || {};
		const defaultQueries = {
			transact: {
				returnType: { name: 'Transaction' },
				params: {
					options: 'TransactOptions'
				}
			}
		};

		const defaultMethods = {
			id: {
				returnType: { name: 'ID' }
			},
			version: {
				returnType: { name: 'Int' }
			}
		};

		const defaultActions = {
			id: {
				returnType: { name: 'ID' }
			},
			commit: {
				returnType: { name: 'Result' },
				params: {
					options: 'CommitOptions'
				}
			}
		};

		const defaultEntities = {
			Query: {

				// safe-assign: does not let users to override default `Query` methods
				methods: _.assign({}, queries, defaultQueries)
			},
			Aggregate: {

				// safe-assign: does not let users to override default `Aggregate` methods
				methods: _.assign({}, methods, defaultMethods)
			},
			Transaction: {

				// safe-assign: does not let users to override default `Transaction` methods
				methods: _.assign({}, actions, defaultActions)
			},
			Result: {
				methods: {
					id: {
						returnType: {
							name: 'ID!'
						}
					},
					success: {
						returnType: {
							name: 'Boolean'
						}
					}
				}
			}
		};

		const defaultInputEntities = {
			TransactOptions: {
				methods: {
					subscribe: {
						returnType: {
							name: 'Boolean'
						}
					}
				}
			},
			CommitOptions: {
				methods: {
					wait: {
						returnType: {
							name: 'Boolean'
						}
					},
					timeout: {
						returnType: {
							name: 'Int'
						}
					}
				}
			}
		};

		const types = _.reduce(_.defaultsDeep({}, defaultEntities, entities), (result, entity, name) => {
			const entityMethods = _.get(entity, 'methods') || {};
			const typeEntityDef = getDefinition('type', name, entityMethods);

			return `${result}${typeEntityDef}${LF}`;
		}, '');

		const inputs = _.reduce(_.defaultsDeep({}, defaultInputEntities, inputEntities), (result, input, name) => {
			const inputMethods = _.get(input, 'methods') || {};
			const inputEntityDef = getDefinition('input', name, inputMethods);

			return `${result}${inputEntityDef}${LF}`;
		}, '');

		const typeDefs = `
"""
Sample documentation for Aggregate
"""
${types}

${inputs}
`;

		return typeDefs;
	}

	function getDefinition(type, name, queries) {
		const queryDefs = getQueryDefs(queries);

		return `${type} ${name} {${LF}${queryDefs}${LF}}${LF}`;
	}

	function getQueryDefs(queries) {

		const queryDefs = _.reduce(queries || {}, (result, query, name) => {
			const params = getQueryParams(_.get(query, 'params'));
			const returnTypeName = _.get(query, 'returnType.name');
			const returnTypeIsCollection = _.get(query, 'returnType.isCollection');
			const returnType = returnTypeIsCollection
				? `[${returnTypeName}]`
				: returnTypeName;
			const prevResult = result && `${result}${LF}`;

			return returnType
				? `${prevResult} ${name}${params}: ${returnType}`
				: result;
		}, '');

		return queryDefs;
	}

	function getQueryParams(params) {

		const queryParams = _.reduce(params, (result, type, name) => {
			const prevResult = result && (`${result}, `);

			return type ? `${prevResult}${name}:${type}` : result;
		}, '');

		return queryParams ? `(${queryParams})` : '';
	}

	function getResolvers(typeDefsRaw) {
		const { actions, queries, methods, entities, repository } = typeDefsRaw;

		const defaultEntities = {
			Query: {
				methods: queries
			},
			Aggregate: {
				methods
			}
		};

		const resolvers = _.reduce(_.defaultsDeep({}, defaultEntities, entities), (result, entity, name) => {
			const entityMethods = _.get(entity, 'methods') || {};
			const entityResolvers = getEntityResolvers(name, entityMethods);

			// safe-assign: result is the accumulated list of resolvers for all entities
			return _.assign({}, result, entityResolvers);
		}, {});

		const defaultResolvers = {
			Query: {
				transact: getTransaction({ repository })
			},
			Aggregate: {
				id: obj => Promise.resolve(_.get(obj, 'id') || 0),
				version: obj => Promise.resolve(_.get(obj, 'version') || 0)
			},
			Result: {
				id: obj => Promise.resolve(_.get(obj, 'id')),
				success: obj => Promise.resolve(_.get(obj, 'success'))
			},
			Transaction: _.defaultsDeep({}, {
				commit
			}, getTransactionResolvers({ actions }))
		};

		const result = _.defaultsDeep({}, defaultResolvers, resolvers);

		return result;
	}

	function getTransaction(options) {
		const { repository } = options || {};

		return (obj, args, rawCtxt) => {
			const id = rawCtxt.trxId;

			const ctxt = getFilteredImmutableCtxt(rawCtxt);

			return Promise.resolve(Map({
				id,
				repository: Map(repository),
				ctxt,
				tasks: List([])
			}));
		};
	}

	function getFilteredImmutableCtxt(ctxt) {
		return toImmutable(_.pick(ctxt, [
			'baseUrl',
			'cookies',
			'hostname',
			'ip',
			'method',
			'originalUrl',
			'params',
			'path',
			'protocol',
			'query',
			'route',
			'user'
		]));
	}

	async function commit(obj, args, rawCtxt) {
		const id = obj.get('id');
		const repository = obj.get('repository');
		const uri = repository
			? repository.get('uri')
			: '';
		const tmp = [{}]; // TODO: replace me

		logger.info('commit', { obj });

		const dispatch = getDispatcher({ uri });

		const result = await dispatch(tmp, args, rawCtxt);

		const success = _.get(result, 'success');

		return { id, success };
	}

	function getEntityResolvers(entityName, methods) {
		const resolvers = _.reduce(methods, (result, method, methodName) => {
			const resolver = _.get(method, 'resolver');

			// safe-assign: result is the accumulated list of resolvers for the entity
			return _.assign({}, result, _.set({}, methodName, getDispatcher(resolver)));
		}, {});

		return _.set({}, entityName, resolvers);
	}

	function getDispatcher(resolver) {
		if (!resolver) {
			return () => {
				throw new Error('Resolver not found'); // TODO: consider localization
			};
		}

		// TODO: add configuration for self-signed certs
		const { uri, config } = resolver || {};

		return (obj, args, rawCtxt, info) => {

			const { path } = info || {};
			const { prev: parentPath } = path || {};
			const { trxId } = rawCtxt || {};

			logger.trace('GraphQL resolver path', { trxId, uri, parentPath });

			const ctxt = getFilteredImmutableCtxt(rawCtxt);

			return new Promise((resolve, reject) => {
				request({
					url: uri,
					method: 'POST',
					json: { config, obj, args, ctxt }
				}, (httpError, res, body) => {
					if (httpError) {
						logger.error('api unable to resolve', { httpError, body, uri });

						return reject(new Error('Unexpected error while resolving'));
					}

					const { error, data } = body || {};

					if (error) {
						return reject(error);
					}

					return resolve(data);
				});
			});
		};
	}

	function getTransactionResolvers(options) {
		const { actions } = options || {};

		return _.mapValues(actions, (action, name) => ((obj, args) => {
			const resolver = _.get(action, 'resolver') || {};
			const tasks = obj.get('tasks');
			const task = Map({
				name,
				args: toImmutable(args),
				resolver
			});

			return obj.set('tasks', tasks.push(task));
		}));
	}

	return plugin;
});
