// Update with your config settings.
const configs = require('./src/configs/index');
const dbConfigs = configs.getDatabaseConfig();
module.exports = {
	...dbConfigs,
	test: {
		client: 'sqlite3',
		connection: ':memory:',
		pool: dbConfigs.pool
	},
	migrations: {
		tableName: 'knex_migrations'
	},
};
