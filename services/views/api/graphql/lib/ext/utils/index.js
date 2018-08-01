/* global define */
'use strict';

define([
	'-/ext/utils/lib/to-immutable.js',
	'-/ext/utils/lib/to-json.js'
], (toImmutable, toJSON) => {
	const plugin = {
		toImmutable,
		toJSON
	};

	return plugin;
});
