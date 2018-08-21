/* globals define */
'use strict';

define([
	'lodash',
	'-/ext/graphql/lib/properties.js'
], (
	_,
	{ METHODS }
) => function getMethods(aggregate) {
	const methods = _.get(aggregate, METHODS) || {};
	const hasReturnType = _.unary(_.partialRight(_.has, 'returnType'));

	return _.pickBy(methods, hasReturnType);
});
