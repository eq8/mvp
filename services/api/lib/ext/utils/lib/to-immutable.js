/* global define */
'use strict';

define([
	'lodash',
	'immutable'
], (_, { Map }) => function toImmutable(value) {
	if (_.isObject(value)) {
		return Map(_.mapValues(value, v => toImmutable(v)));
	}

	return value;
});
