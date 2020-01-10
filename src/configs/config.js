require('dotenv').config();

module.exports = {
  database: {
    client: 'mysql',
    connection: {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      requestTimeout: 90000,
      connectionTimeout: 30000,
      acquireConnectionTimeout: 30000,
    },
    pool: {
      min: 4,
      max: 10,
    },
  },
  server: {
    port: process.env.PORT || 5000,
    routes: {
      cors: {
        headers: [
          'Accept',
          'Authorization',
          'Content-Type',
          'If-None-Match',
          'Accept-language',
        ],
      },
    },
    jwtSecret: process.env.JWY_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION_TIME,
    googleAuth: {
      clientId: process.env.GOOGLE_AUTH_KEY,
      clientSecret: process.env.GOOGLE_AUTH_SECRET,
    },
    awsEmailConfig: {
      accessKeyId: process.env.AWS_EMAIL_AUTH_KEY,
      secretAccessKey: process.env.AWS_EMAIL_AUTH_SECRET,
    },
    facilitatorEmails: [],
  },
  courseConfig: {
    courseCompletionCriteria: 70,
  },
  scheduleConfig: {
    seconds: '*',
    minute: '59',
    hour: '23',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*',
    receiverEmail: process.env.REPORT_RECIEVER_EMAIL,
  },
  cliqConfig: {
    authtoken: process.env.CLIG_AUTH_TOKEN,
  },
  sentryConfig: {
    sentryDsn: process.env.SENTRY_DSN,
  },
  bellConfig: {
    password: 'cookie_encryption_password_secure',
    provider: 'google',
    isSecure: false,
    location: (port) => `http://localhost:${port}/bell`
  }
};
