module.exports = {
	env: {
		browser: true,
		es6: true,
	},
	extends: [
		'airbnb-base',
		'eslint:recommended'
	],
	globals: {
		Atomics: 'readonly',
		SharedArrayBuffer: 'readonly',
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	rules: {
		'complexity': ['error', 5],
		'max-depth': ['error', 2],
		'max-lines-per-function': ['error', {'max': 25}],
		'max-nested-callbacks': ['error', 3],
    'max-params': ['error', 3],
    'semi': ['error', 'always'],
    'quotes': ['error', 'double']

	},
};
