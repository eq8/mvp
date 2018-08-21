/* globals define */
'use strict';

define([
	'lodash',
	'lru-cache',
	'-/logger/index.js',
	'-/ext/graphql/lib/get-loader.js'
], (_, lru, logger, getLoader) => {
	const loaders = lru({
		max: 256 // TODO: remove hardcoding
	});

	return {
		load({ uri, prevPath, obj, ctxt, trxId, args, config }) {
			const loader = loaders.get(uri) || getLoader({ uri });

			loaders.set(uri, loader);

			return loader.load({ prevPath, obj, ctxt, trxId, args, config });
		}
	};
});
