const Hapi = require("hapi");
const bellPlugin = require('../bell');

test('should be able to register properly to server', async function () {
	const server = {
		auth: {
			strategy: jest.fn(),
		},
		register: jest.fn().mockResolvedValue(),
		info: {
			port: 3000
		}
	};
	const options = {
		serverConfigs: {
			bellConfig: {
				password: 'password',
				provider: 'provider',
				isSecure: 'isSecure',
				location: jest.fn((port) => 'location' + port)
			},
			googleAuth: {
				clientId: 'clientId',
				clientSecret: 'clientSecret'
			}
		}
	};

	await bellPlugin.register(server, options);

	expect(server.auth.strategy.mock.calls).toHaveLength(1);
	expect(server.auth.strategy.mock.calls[0][0]).toBe(options.serverConfigs.bellConfig.provider);
	expect(server.auth.strategy.mock.calls[0][1]).toBe('bell');
	expect(server.auth.strategy.mock.calls[0][2]).toStrictEqual({
		password: 'password',
		provider: 'provider',
		isSecure: 'isSecure',
		location: 'location3000',
		clientId: 'clientId',
		clientSecret: 'clientSecret'
	});

	expect(server.register.mock.calls).toHaveLength(1);
	expect(server.register.mock.calls[0][0]).toBe(require('bell'));
});
