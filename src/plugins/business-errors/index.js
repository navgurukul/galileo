const Boom = require('@hapi/boom');
const _ = require('underscore');
const businessErrors = require('../../configs/businessErrors');

const internals = {
	version: '1.0.0',
	name: 'Decorated Business Error',
};

module.exports = {
	register: (server, options = {businessErrors}) => server.register({
		version: internals.version,
		name: internals.name,
		register: internals.register(options.businessErrors),
	}),
	info: () => ({
		name: internals.name,
		version: internals.version,
	}),
};

internals.register = (businessErrors) => async (server, options) => {
	server.decorate('server', 'boom', Boom);
	server.decorate('toolkit', 'boom', Boom);
	_.forEach(_.keys(businessErrors), (key) => {
		const {
			statusCode,
			message,
		} = businessErrors[key];
		const method = (options = {}) => server.boom.boomify(new Error(message), {
			statusCode,
			...options,
		});
		server.decorate('server', key, method);
		server.decorate('toolkit', key, method);
	});
};
