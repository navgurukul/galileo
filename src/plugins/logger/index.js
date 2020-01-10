module.exports =  {
  register: (server) => new Promise((resolve) => {
    const opts = {
      ops: {
        interval: 1000,
      },
      reporters: {
        console: [
          {
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ log: '*', response: '*', error: '*' }],
          },
          {
            module: 'good-console',
          },
          'stdout',
        ],
      },
    };

    server.register({
      plugin: require('good'),
      options: opts,
    })
      .then(() => {
        resolve();
      });
  }),
  info: () => ({
    name: 'Good Logger',
    version: '1.0.0',
  }),
};
