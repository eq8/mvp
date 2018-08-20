/* globals define, Promise */
'use strict';

define([
	'lodash',
	'immutable',
	'dataloader',
	'lru-cache',
	'request',
	'-/logger/index.js'
], (_, { Map, List }, DataLoader, lru, request, logger) => {
	const loaders = lru({
		max: 256 // TODO: remove hardcoding
	});

	const LoaderFactory = {
		create({ uri }) {
			return new DataLoader(keys => {
				const json = _.reduce(keys, (result, key) => {
					const { prevPath, obj, ctxt, trxId, args, config } = key || {};

					return result
						.mergeDeep(Map({ objects: Map({}).set(prevPath, obj) }))
						.mergeDeep(Map({ contexts: Map({}).set(trxId, ctxt) }))
						.mergeDeep(Map({ batch: result.get('batch').push({ prevPath, trxId, args, config }) }));
				}, Map({
					objects: Map({}),
					contexts: Map({}),
					batch: List([])
				})).toJS();

				return new Promise((resolve, reject) => {
					request({
						url: uri,
						method: 'POST',
						json
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
			}, { cache: false });
		}
	};

	return {
		load({ uri, prevPath, obj, ctxt, trxId, args, config }) {
			const loader = loaders.get(uri) || LoaderFactory.create({ uri });

			loaders.set(uri, loader);

			return loader.load({ prevPath, obj, ctxt, trxId, args, config });
		}
	};
});
