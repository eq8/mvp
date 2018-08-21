/* globals define, Promise */
'use strict';

define([
	'lodash',
	'immutable',
	'dataloader',
	'request',
	'-/logger/index.js'
], (_, { Map, List }, DataLoader, request, logger) => function getLoader({ uri }) {
	return new DataLoader(keys => {
		const initial = Map({
			objects: Map({}),
			contexts: Map({}),
			batch: List([])
		});
		const json = _.reduce(keys, (result, key) => {
			const { prevPath, obj, ctxt, trxId, args, config } = key || {};

			return result
				.mergeDeep(Map({ objects: Map({}).set(`${trxId}/${prevPath}`, obj) }))
				.mergeDeep(Map({ contexts: Map({}).set(trxId, ctxt) }))
				.mergeDeep(Map({ batch: result.get('batch').push({ prevPath, trxId, args, config }) }));
		}, initial).toJS();

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
	}, {
		maxBatchSize: 128, // TODO: remove hardcoding
		cache: false
	});
});
