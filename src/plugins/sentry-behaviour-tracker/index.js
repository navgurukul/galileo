module.exports =  {
	register: (server, options, configs) => new Promise((resolve) => {

		server.events.on('request', (request, event, tags) => {
			if (tags.error) {
				const sentry = configs.getSentryConfig();
				enableTrackingUserBehaviour(request, event, sentry);
			}
		});
		resolve();
	}),
	info: () => ({
		name: 'SentryBehaviourTracker',
		version: '1.0.0',
	}),
};

const UNKNOWN = 'unknown';
function enableTrackingUserBehaviour(request, event, sentry) {
	function getErrorMessage(event) {
		return event.error ? event.error.message : UNKNOWN;
	}
	function isError(event) {
		return event.error && event.error.stack;
	}

	let subStr = [];

	// TODO: Can be refactored out so we can avoid conditions
	if (isError(event)) {
		const { stack } = event.error;
		subStr = stack.match('\n(.*)\n');
	} else {
		subStr[0] = UNKNOWN;
	}
	const additionalData = {
		url: request.url.path,
		logedinId: request.userId,
		requestType: request.method,
		requestParam: request.params,
		requestQuery: request.query,
		requestPayload: request.payload,
		time: new Date(event.timestamp),
		line: subStr[0],
		errorPayload: event.error.output.payload,
		message: getErrorMessage(event),
		environment: process.env.GALILEO_ENV,
	};
	sentry.withScope((scope) => {
		Object.keys(additionalData).forEach((key) => {
			scope.setExtra(key, additionalData[key]);
		});
		sentry.captureMessage(getErrorMessage(event));
	});
}
