const Hapi = require('hapi');
const knex = require('knex');
const color = require('colors');
const Plugins = require('./plugins');
const Routes = require('./routes');
const Services = require('./services');
const Models = require('./models');

const mergePluginsIfProductionEnv = (Plugins) => {
	if (process.env.GALILEO_ENV === 'prod') {
		const pluginsClone = Plugins.loadBefore.slice();
		return pluginsClone.concat(Plugins.onlyForProduction);
	}
	return Plugins.loadBefore;
};

function logPluginRegistered(plugin) {
	console.log(color.green(`Register Plugin ${plugin.info().name} v${plugin.info().version}`));
}

function init(configs) {
	const databaseConfig = configs.getDatabaseConfig();
	const serverConfigs = configs.getServerConfigs();

	return new Promise(async (resolve) => {
		const server = new Hapi.Server({
			port: serverConfigs.port,
			routes: serverConfigs.routes,
		});
		const databaseConnector = new knex(databaseConfig);
		const pluginOptions = {
			database: databaseConnector,
			serverConfigs,
			configs,
		};

		await Promise.all(mergePluginsIfProductionEnv(Plugins).map((plugin) => {
			logPluginRegistered(plugin);
			return plugin.register(server, pluginOptions);
		}));
		Models.forEach((model) => server.schwifty(model));
		// TODO: Should  we use schmervice as it creates a
		//  trouble for unit test as we can't have dependency injection
		Services.forEach((service) => server.registerService(service));

		await Promise.all(Plugins.loadAfter.map((plugin) => {
			logPluginRegistered(plugin);
			return plugin.register(server, pluginOptions);
		}));

		await Routes.forEach((route) => route.init(server, databaseConnector, configs));
		resolve(server);
	});
}

module.exports = {init};
