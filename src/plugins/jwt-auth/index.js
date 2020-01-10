const hapiJWTAuth = require('hapi-auth-jwt2');

module.exports = {
	register: (server, options) => {
		const {database} = options;
		const serverConfig = options.serverConfigs;
		return server.register(hapiJWTAuth).then(async () => {
			const validateUser = (decoded, request) => {
				request.userId = decoded.id;
				// TODO: extract all the information related to user
				// so we don't have to make same api call more than once.
				return {
					isValid: true,
				};
			};
			await server.auth.strategy('jwt', 'jwt', {
				key: serverConfig.jwtSecret,
				validate: validateUser,
				verifyOptions: {algorithms: ['HS256']},
			});

			await server.auth.default('jwt');
		});

	},
	info: () => ({
		name: 'JWT Authentication',
		version: '1.0.0',
	}),
};
