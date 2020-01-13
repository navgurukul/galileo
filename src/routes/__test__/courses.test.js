const Server = require("../../server");
const configs = require("../../configs");

test('should be able to create courses', async function () {
	const server = await Server.init(configs);
	const payload = {
		name: "Android 101",
	};
	const options = {
		method: "GET",
		url: '/courses',
		payload: JSON.stringify(payload),
	};

	const response = await server.inject(options);

	expect(response.payload).toBe("hello world")
});

test('should be able to get all courses', async function () {

});
