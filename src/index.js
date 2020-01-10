const color = require('colors');
const Server = require('./server');
const configs = require('./configs');

function createScheduleForCronJob(scheduleConfigs) {
  const {
    seconds,
    minute,
    hour,
    dayOfMonth,
    dayOfWeek,
    month,
  } = scheduleConfigs;
  /**
    * * * * * *
    | | | | | |
    | | | | | day of week
    | | | | month
    | | | day of month
    | | hour
    | minute
    second ( optional )
  * */
  return `${seconds} ${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}
const start = async () => {
  // const scheduleConfigs = configs.getScheduleConfigs();
  const server = await Server.init(configs);
  if (!module.parent) {
    await server.start();
    console.log(color.green('Server running at:', server.info.uri));
    // TODO: create a service to handle cronJob
    // let schedule = createScheduleForCronJob(scheduleConfigs);
    // cron.schedule(schedule, function () {
    //     console.log("Running Cron Job");

    //     request(server.info.uri+'/reports/getSubmissionReport', function (error, response, body) {
    //         if (!error && response.statusCode === 200) {

    //             console.log("Sent mail");
    //         }
    //     });
    // });
    console.log('Running server from parent :)');
  } else {
    console.log('Not running the `server because it is not run through parent module.');
  }
};

start();
