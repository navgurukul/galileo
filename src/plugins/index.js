module.exports =  {
  loadBefore: [
    require('./schmervice/index'),
    require('./schwifty/index'),
    require('./swagger/index'),
  ],
  onlyForProduction: [
    require('./logger/index'),
    require('./sentry-behaviour-tracker/index')
  ],
  loadAfter: [
    require('./jwt-auth/index'), // Need to access services which can be after schmservice is registered.
  ],
};
