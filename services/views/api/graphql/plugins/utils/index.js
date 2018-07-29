/* global define */
'use strict';

define([
	'-/utils/lib/to-immutable.js',
	'-/utils/lib/to-json.js'
], (toImmutable, toJSON) => {
	const plugin = {
		toImmutable,
		toJSON
	};

	return plugin;
});
