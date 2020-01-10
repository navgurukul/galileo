const Schwifty = require('schwifty');

module.exports =  {
  register: (server, options) => new Promise((resolve) => {
    server.register({
      plugin: Schwifty,
      options: {
        knex: options.database,
      },
    })
      .then(() => resolve());
  }),
  info: () => ({
    name: 'Schwifty',
    version: '1.0.0',
  }),
};
