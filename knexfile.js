// Update with your config settings.
const configs = require('./src/configs');

module.exports = {
	...configs.getDatabaseConfig(),
	// staging: {
	// 	client: 'postgresql',
	// 	connection: {
	// 		database: 'my_db',
	// 		user: 'username',
	// 		password: 'password'
	// 	},
	// 	pool: {
	// 		min: 2,
	// 		max: 10
	// 	},
	// 	migrations: {
	// 		tableName: 'knex_migrations'
	// 	}
	// },
	migrations: {
		tableName: 'knex_migrations'
	},
	production: {
		...configs.getDatabaseConfig(),
		migrations: {
			tableName: 'knex_migrations'
		}
	}

};
