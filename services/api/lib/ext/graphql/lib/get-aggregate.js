/* globals define */
'use strict';

define([
	'lodash',
	'-/logger/index.js'
], (
	_,
	logger
) => function getAggregate(config, args) {
	const { aggregate, v } = args || {};

	const aggregatePath = `aggregates['${aggregate}'].versions['${v}']`;

	logger.debug('aggregatePath', { aggregatePath });

	return _.get(config, aggregatePath);
});
