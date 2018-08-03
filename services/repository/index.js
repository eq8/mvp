'use strict';

const path = require('path');
const define = require('@eq8/mvp-boot')({
	extensions: path.join(__dirname, './lib/ext')
});

define([
	'-/ext/repository/index.js',
], repository => {
	repository.start();
});
