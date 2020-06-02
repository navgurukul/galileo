const Dotenv = require("dotenv")

// Pull .env into process.env
Dotenv.config({ path: `${__dirname}/../.env` });

module.exports = {
    "database": {
        "client": "pg",
        "connection": {
            "database": process.env.DB_NAME,
            "host": process.env.DB_HOST,
            "user": process.env.DB_USER,
            "password": process.env.DB_PASS,
            "requestTimeout": 90000,
            "connectionTimeout": 30000,
            "acquireConnectionTimeout": 30000
        },
        "pool": {
            "min": 4,
            "max": 10
        }
    },
    "server": {
        "port": 5000,
        "jwtSecret": "random-secret-password",
        "jwtExpiration": "72h",
        "plugins": [
            "logger",
            "bell",
            "jwt-auth",
            "swagger"
        ],
        "googleAuth": {
            "clientId": process.env.CLIENT_ID,
            "clientSecret":process.env.CLIENT_SECRET
        },
        "googleCloud": {
            "projectId": process.env.PROJECT_ID,
            "keyFilename": process.env.KEY_FILE_NAME,
            "assignmentsBucket": process.env.ASSIGNMENTS_BUCKET
        },
        "awsEmailConfig": {
            "accessKeyId": process.env.ACCESS_KEY_ID ,
            "secretAccessKey": process.env.SECRET_ACCESS_KEY
        },
        "facilitatorEmails": [
            "r@navgurukul.org",
            "a@navgurukul.org",
            "rishabh@navgurukul.org"
        ],
        "defaultBatchId": 1,
        "githubAccess": {
            "SCHOOL_ID": process.env.SCHOOL_ID,
            "SECRET_KEY": process.env.SECRET_KEY
        },
        "testKey": "helloRun"
    },
    "courseConfig": {
        "courseCompletionCriteria": 70
    },
    "sentryConfig": {
        "sentryDsn": process.env.SENTRY_DSN
    },
    "scheduleConfig": {
        "timeInSecond": process.env.TIME_IN_SECONDS,
        "receiverEmail": process.env.RECEIVER_EMAIL
    },
    "cliqConfig": {
        "authtoken": process.env.CLIQ_AUTH_TOKEN
    }
}
