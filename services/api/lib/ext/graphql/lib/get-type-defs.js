/* globals define */
'use strict';

const LF = '\n';

define([
	'lodash'
], _ => {
	function getTypeDefs(definitions) {
		const { queries, methods, actions, entities, inputEntities } = definitions || {};
		const defaultQueries = {
			transact: {
				returnType: { name: 'Transaction' },
				params: {
					options: 'TransactOptions'
				}
			}
		};

		const defaultMethods = {
			id: {
				returnType: { name: 'ID' }
			},
			version: {
				returnType: { name: 'Int' }
			}
		};

		const defaultActions = {
			id: {
				returnType: { name: 'ID' }
			},
			commit: {
				returnType: { name: 'Result' },
				params: {
					options: 'CommitOptions'
				}
			}
		};

		const defaultEntities = {
			Query: {

				// safe-assign: does not let users to override default `Query` methods
				methods: _.assign({}, queries, defaultQueries)
			},
			Aggregate: {

				// safe-assign: does not let users to override default `Aggregate` methods
				methods: _.assign({}, methods, defaultMethods)
			},
			Transaction: {

				// safe-assign: does not let users to override default `Transaction` methods
				methods: _.assign({}, actions, defaultActions)
			},
			Result: {
				methods: {
					id: {
						returnType: {
							name: 'ID!'
						}
					},
					success: {
						returnType: {
							name: 'Boolean'
						}
					}
				}
			}
		};

		const defaultInputEntities = {
			TransactOptions: {
				methods: {
					subscribe: {
						returnType: {
							name: 'Boolean'
						}
					}
				}
			},
			CommitOptions: {
				methods: {
					wait: {
						returnType: {
							name: 'Boolean'
						}
					},
					timeout: {
						returnType: {
							name: 'Int'
						}
					}
				}
			}
		};

		const types = _.reduce(_.defaultsDeep({}, defaultEntities, entities), (result, entity, name) => {
			const entityMethods = _.get(entity, 'methods') || {};
			const typeEntityDef = getDefinition('type', name, entityMethods);

			return `${result}${typeEntityDef}${LF}`;
		}, '');

		const inputs = _.reduce(_.defaultsDeep({}, defaultInputEntities, inputEntities), (result, input, name) => {
			const inputMethods = _.get(input, 'methods') || {};
			const inputEntityDef = getDefinition('input', name, inputMethods);

			return `${result}${inputEntityDef}${LF}`;
		}, '');

		const typeDefs = `
"""
Sample documentation for Aggregate
"""
${types}

${inputs}
`;

		return typeDefs;
	}

	function getDefinition(type, name, queries) {
		const queryDefs = getQueryDefs(queries);

		return `${type} ${name} {${LF}${queryDefs}${LF}}${LF}`;
	}

	function getQueryDefs(queries) {

		const queryDefs = _.reduce(queries || {}, (result, query, name) => {
			const params = getQueryParams(_.get(query, 'params'));
			const returnTypeName = _.get(query, 'returnType.name');
			const returnTypeIsCollection = _.get(query, 'returnType.isCollection');
			const returnType = returnTypeIsCollection
				? `[${returnTypeName}]`
				: returnTypeName;
			const prevResult = result && `${result}${LF}`;

			return returnType
				? `${prevResult} ${name}${params}: ${returnType}`
				: result;
		}, '');

		return queryDefs;
	}

	function getQueryParams(params) {

		const queryParams = _.reduce(params, (result, type, name) => {
			const prevResult = result && (`${result}, `);

			return type ? `${prevResult}${name}:${type}` : result;
		}, '');

		return queryParams ? `(${queryParams})` : '';
	}

	return getTypeDefs;
});
