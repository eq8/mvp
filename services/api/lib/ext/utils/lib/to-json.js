/* global define */
'use strict';

define([
	'lodash'
], _ => function toJSON(value) {
	return _.isObject(value)
		? value.map(v => toJSON(v))
		: value;
});
