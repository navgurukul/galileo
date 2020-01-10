const  Schmervice = require('schmervice');

module.exports =  {
  register: (server, options) => new Promise((resolve) => {
    server.register(Schmervice)
      .then(() => resolve());
  }),
  info: () => ({
    name: 'Schmervice',
    version: '1.0.0',
  }),
};
