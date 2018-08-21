/* globals define */
'use strict';

define([
	'lodash',
	'-/ext/graphql/lib/properties.js'
], (
	_,
	{ QUERIES }
) => function getQueries(aggregate) {
	const queries = _.get(aggregate, QUERIES) || {};

	return _.mapValues(
		queries,

		// safe-assign: all queries returns a collection of `Aggregate`'s
		query => _.assign({}, query, { returnType: { name: 'Aggregate', isCollection: true } })
	);
});
