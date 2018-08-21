/* globals define */
'use strict';

define([
	'lodash',
	'-/ext/graphql/lib/properties.js'
], (
	_,
	{ ENTITIES }
) => function getEntities(aggregate) {
	const entities = _.get(aggregate, ENTITIES) || {};

	// TODO: add code to validate entities
	// const hasName = _.partialRight(_.has, 'methods');

	return entities; // _.pickBy(entities, hasName);
});
