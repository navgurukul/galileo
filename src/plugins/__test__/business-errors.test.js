const Hapi = require("hapi");
const Boom = require('@hapi/boom')
const businessErrorPlugin = require('../business-errors');

test('should be able to register properly to server', async function () {
	const server = new Hapi.Server({});
	const options = {
		businessErrors: {
			duplicateKeyError: {
				statusCode: 419,
				message: 'Duplicate key found.',
			},
			NoUserFoundError: {
				statusCode: 404,
				message: 'No User Found.'
			}
		}
	};

	await businessErrorPlugin.register(server, options);

	expect(server.boom).toBeTruthy();
	expect(server.duplicateKeyError()).toBeInstanceOf(Boom.Boom);
	expect(server.duplicateKeyError().output.statusCode).toBe(419);
	expect(server.duplicateKeyError().output.payload.message).toBe(
		options.businessErrors.duplicateKeyError.message
	);

	expect(server.NoUserFoundError()).toBeInstanceOf(Boom.Boom);
	expect(server.NoUserFoundError().output.statusCode).toBe(404);
	expect(server.NoUserFoundError().output.payload.message).toBe(
		options.businessErrors.NoUserFoundError.message
	);
});
