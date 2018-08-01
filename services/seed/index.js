'use strict';

const r = require('rethinkdb');
const retryInterval = parseInt(process.env.RETRY_INTERVAL || '100', 10);
const retryMax = parseInt(process.env.RETRY_INTERVAL || '1000', 10);

let retryCount = 1;

connectAndSeed();

async function connectAndSeed() {
	try {
		const conn = await r.connect({
			host: process.env.HOST || 'rethinkdb',
			port: process.env.PORT || 28015,
			username: process.env.USERNAME || 'admin',
			password: process.env.PASSWORD
		});
		const domains = 'domains';

		await r.tableList().contains(domains)
			.do(tableExists => r.branch(tableExists, { tables_created: 0 }, r.tableCreate(domains)))
			.run(conn);

		console.log('Seed Domains:', await seedDomain({ conn, table: domains })); // eslint-disable-line no-console

		const boundedContexts = 'boundedContexts';

		await r.tableList().contains(boundedContexts)
			.do(tableExists => r.branch(tableExists, { tables_created: 0 }, r.tableCreate(boundedContexts)))
			.run(conn);

		console.log('Seed Bounded Contexts:', await seedBoundedContexts({ conn, table: boundedContexts })); // eslint-disable-line no-console
	} catch (err) {
		console.error('Error seeding:', err); // eslint-disable-line no-console
		setTimeout(connectAndSeed, Math.min(retryInterval * retryCount++, retryMax));
	}
}

function seedDomain({ conn, table }) {
	const id = '127.0.0.1';

	return r
		.table(table)
		.get(id)
		.replace({
			id,
			version: 1,
			disableDefaultRoutes: false,
			routes: {
				'/': {
					view: 'http://view-ui-default/'
				},
				'/api/domain/0.0': {
					view: 'http://view-api-graphql/api/domain/0.0',
					authenticate: {
						secretOrKeyProvider: 'https://bbartolome.auth0.com/.well-known/jwks.json'
					}
				}
			}
		})
		.run(conn);
}

function seedBoundedContexts({ conn, table }) {
	const id = '127.0.0.1/api';

	return r
		.table(table)
		.get(id)
		.replace({
			id,
			version: 1,
			aggregates: {
				domain: {
					tags: {
						latest: '0.0.0',
						stable: '0.0.0'
					},
					versions: {
						'0.0': {
							inputEntities: {
								InputDomainID: {
									methods: {
										id: {
											returnType: {
												name: 'ID'
											}
										}
									}
								},
								InputDomainPagination: {
									methods: {
										skip: {
											returnType: {
												name: 'Int'
											}
										},
										length: {
											returnType: {
												name: 'Int'
											}
										},
										direction: {
											returnType: {
												name: 'Int'
											}
										}
									}
								}
							},
							entities: {
								Meta: {
									methods: {
										created: {
											resolver: {
												uri: 'http://resolver-utils-get/0.0?path=created'
											},
											returnType: {
												name: 'String'
											}
										},
										createdBy: {
											resolver: {
												uri: 'http://resolver-utils-get/0.0?path=createdBy'
											},
											returnType: {
												name: 'String'
											}
										},
										lastModified: {
											resolver: {
												uri: 'http://resolver-utils-get/0.0?path=lastModified'
											},
											returnType: {
												name: 'String'
											}
										},
										lastModifiedBy: {
											resolver: {
												uri: 'http://resolver-utils-get/0.0?path=lastModifiedBy'
											},
											returnType: {
												name: 'String'
											}
										}
									}
								},
								Repository: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										},
										uri: {
											returnType: {
												name: 'String'
											}
										}
									}
								},
								BoundedContext: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										}
									}
								},
								Aggregate: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										},
										entities: {
											returnType: {
												name: 'Entity',
												isCollection: true
											}
										},
										methods: {
											returnType: {
												name: 'Method',
												isCollection: true
											}
										},
										queries: {
											returnType: {
												name: 'Query',
												isCollection: true
											}
										},
										actions: {
											returnType: {
												name: 'Action',
												isCollection: true
											}
										}
									}
								},
								Entity: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										}
									}
								},
								Method: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										}
									}
								},
								Query: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										}
									}
								},
								Action: {
									methods: {
										name: {
											returnType: {
												name: 'String'
											}
										}
									}
								}
							},
							actions: {
								browse: {
									params: {
										in: 'InputDomainPagination'
									}
								},
								read: {
									params: {
										in: 'InputDomainID'
									}
								},
								add: {
									params: {
										in: 'InputDomainID'
									}
								},
								delete: {
									params: {
										in: 'InputDomainID'
									}
								}

								/*
								 * editDomain
								 * addRepository
								 * addBoundedContext
								 * addAggregate
								 * addMethod
								 * addAction
								 * addQuery
								 * addEntity
								 * addInputEntity
								 */

							},
							methods: {
								meta: {
									resolver: {
										uri: 'http://resolver-utils-get/0.0?path=meta'
									},
									returnType: {
										name: 'Meta'
									}
								}
							},
							queries: {
								load: {
									resolver: {
										uri: 'http://resolver-api-domain-query-load/0.0'
									},
									params: {
										in: 'InputDomainID'
									}
								}
							},

							// reducers: {}, // TODO: use for showing result aggregates

							repository: 'default',
							rootEntity: 'domain',
							schemaVersion: '0.0'
						}
					}
				}
			},
			repositories: {
				default: {
					uri: 'https://repository/api' // TODO: define API for repositories
				}
			}
		})
		.run(conn);
}
