/* globals define */
'use strict';

define([
	'lodash',
	'-/logger/index.js',
	'-/ext/graphql/lib/properties.js'
], (
	_,
	logger,
	{ REPOSITORY }
) => function getRepository(config, aggregate) {
	const repositoryName = _.get(aggregate, REPOSITORY);
	const repositoryPath = `repositories['${repositoryName}']`;
	const repository = _.get(config, repositoryPath);

	logger.debug('repositoryPath', { repositoryPath });
	logger.debug('repository', { repository });

	return repository;
});
