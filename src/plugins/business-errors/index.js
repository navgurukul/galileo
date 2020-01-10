const Boom = require('boom');
const _ = require('underscore');
const BusinessErrors = require('../../configs/businessErrors');

const internals = {
	version: '1.0.0',
	name: 'Decorated Business Error',
};

module.exports = {
	register: (server, options) => server.register({
		version: internals.version,
		name: internals.name,
		register: internals.register,
	}),
	info: () => ({
		name: internals.name,
		version: internals.version,
	}),
};

internals.register = async (server, options) => {
	server.decorate('server', 'boom', Boom);
	server.decorate('toolkit', 'boom', Boom);
	_.forEach(_.keys(BusinessErrors), (key) => {
		const {
			statusCode,
			message,
		} = BusinessErrors[key];
		const method = (options = {}) => server.boom.boomify(new Error(message), {
			statusCode,
			...options,
		});
		server.decorate('server', key, method);
		server.decorate('toolkit', key, method);
	});
};
