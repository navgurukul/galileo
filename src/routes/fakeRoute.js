function FakeRoute(server, databaseConfig, configs) {
	server.route({
		method: 'GET',
		path: '/courses',
		config: {
			description: 'List of courses under 3 categories: \
                            1. User has enrolled in. \
                            2. User has completed. \
                            3. Courses that a user can do next.',
			response: {
				// schema: Joi.object({})
			},
			auth: {
				strategy: 'jwt',
				mode: 'optional'
			},
			tags: ['api'],
			handler: async () => {
				return "hello world"
			}
		}
	});
}

module.exports = {
	init: FakeRoute,
};
