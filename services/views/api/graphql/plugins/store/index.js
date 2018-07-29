/* global define, Promise */
'use strict';

define([
	'lodash',
	'lru-cache',
	'immutable',
	'url-parse',
	'rethinkdb',
	'-/logger/index.js'
], (_, lru, { Map }, parse, r, logger) => {
	let cursors = Map({});

	const max = !_.isNaN(parseInt(process.env.MVP_STORE_LRU_MAXSIZE, 10))
		? parseInt(process.env.MVP_STORE_LRU_MAXSIZE, 10)
		: 500;
	const maxAge = !_.isNaN(parseInt(process.env.MVP_STORE_LRU_MAXAGE, 10))
		? parseInt(process.env.MVP_STORE_LRU_MAXAGE, 10)
		: 1000 * 60 * 60;
	const cache = lru({
		max,
		maxAge,
		dispose(key) {
			(cursors.get(key) || { close: _.noop }).close();
		},
		noDisposeOnSet: true
	});

	let conn;

	const plugin = {
		async connect(options) {
			const settings = _.defaultsDeep(options, {
				storeUri: process.env.MVP_STORE_URI || 'rethinkdb://admin@127.0.0.1:28015'
			});

			const defaults = {
				protocol: 'rethinkdb',
				hostname: '127.0.0.1',
				port: 28015,
				username: 'admin'
			};

			const {
				protocol, hostname: host, port, username: user, password
			} = _.defaultsDeep(parse(settings.storeUri), defaults);

			if (protocol !== 'rethinkdb:') {
				throw new Error('Unsupported store protocol');
			}

			logger.debug('store setings:', settings);

			conn = await r.connect({ host, port, user, password });

			return { success: true };
		},
		browse({ type, where, skip, limit }) {
			let q = r.table(type);

			if (_.isObject(where)) {
				let tmp = q;

				_.each(_.keys(where), key => {
					tmp = q.getAll(where[key]);
				});

				q = tmp;
			}

			if (_.isInteger(skip)) {
				q = q.skip(skip);
			}

			if (_.isInteger(limit)) {
				q = q.limit(limit);
			}

			return q.run(conn);
		},
		read({ type, id }) {
			const key = `${type}/${id}`;
			const value = cache.get(key);

			return value
				? Promise.resolve(value)
				: new Promise((resolve, reject) => {
					r.table(type)
						.get(id)
						.changes({ includeInitial: true, squash: true })
						.run(conn, (err, cursor) => {
							if (err) {
								return reject(err);
							}

							cursors = cursors.set(key, cursor);

							let unresolved = true;

							return cursor.each((eachErr, row) => {
								const { new_val: v } = row || {}; // eslint-disable-line camelcase

								cache.set(key, v);
								if (unresolved) {
									unresolved = false;
									resolve(v);
								}
							});
						});
				});
		},
		edit({ type, object }) {
			return r.table(type)
				.get(object.id)
				.replace(doc => (
					(object.version > (doc.version || 0))
						? object
						: doc
				))
				.run(conn);
		},
		add({ type, objects }) {
			r.table(type)
				.insert(objects)
				.run(conn);
		},
		delete({ type, selection }) {
			return r.table(type)
				.getAll(r.args(selection))
				.delete()
				.run(conn);
		}
	};

	return plugin;
});
