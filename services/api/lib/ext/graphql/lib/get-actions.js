/* globals define */
'use strict';

define([
	'lodash',
	'-/ext/graphql/lib/properties.js'
], (
	_,
	{ ACTIONS }
) => function getActions(aggregate) {
	const actions = _.get(aggregate, ACTIONS) || {};

	return _.mapValues(
		actions,

		// safe-assign: all actions return a `Transaction` object
		action => _.assign({}, action, { returnType: { name: 'Transaction' } })
	);
});
