/* globals define, Promise */
'use strict';

define([
	'lodash',
	'immutable',
	'-/logger/index.js',
	'-/ext/graphql/lib/to-immutable.js',
	'-/ext/graphql/lib/batch-resolver.js'
], (
	_,
	{ Map, List },
	logger,
	toImmutable,
	batchResolver
)	=> {
	function getResolvers(definitions) {
		const { actions, queries, methods, entities, repository } = definitions;

		const defaultEntities = {
			Query: { methods: queries },
			Aggregate: { methods }
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

	function getEntityResolvers(entityName, methods) {
		const resolvers = _.mapValues(methods, toDispatcher);

		return _.set({}, entityName, resolvers);
	}

	function toDispatcher(method) {
		const resolver = _.get(method, 'resolver');

		return getDispatcher(resolver);
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

			const { trxId } = rawCtxt || {};
			const prevPath = getPathAsString(_.get(info, 'path.prev'));

			const ctxt = getFilteredImmutableCtxt(rawCtxt);

			return batchResolver.load({ uri, prevPath, obj, ctxt, trxId, args, config });
		};
	}

	function getPathAsString(path, initial) {
		const { prev, key } = path || {};

		if (!path) {
			return initial || '';
		}

		const result = initial
			? `${key}.${initial}`
			: key || '';

		return getPathAsString(prev, result);
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

	return getResolvers;
});
