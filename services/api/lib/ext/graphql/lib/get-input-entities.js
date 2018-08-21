/* globals define */
'use strict';

define([
	'lodash',
	'-/ext/graphql/lib/properties.js'
], (
	_,
	{ INPUT_ENTITIES }
) => function getInputEntities(aggregate) {
	const entities = _.get(aggregate, INPUT_ENTITIES) || {};

	// const hasName = _.partialRight(_.has, 'methods');

	return entities; // _.pickBy(entities, hasName);
});
