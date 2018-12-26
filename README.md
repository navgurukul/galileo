`I have never met a man so ignorant that I couldn't learn something from him. ~ Galileo`

# galileo
Made using hapi.js, the repository uses mysql database.

## How to Run?

**Installation**
* *npm install -g gulp@3.9.0*
* *npm install -g typescript*
* *npm install -g typings* (required for setup)
* *npm install yarn* (required for installing dev-dependencies)
* *yarn install* (install dependencies and dev-dependencies from package.json)
* *npm run setup* (install nuget packages & typings)

**Configuration**
* export GALILEO_ENV='dev'
* cp src/configurations/sample-config.json src/configurations/config.dev.json
* Edit the contents of src/configurations/config.dev.json to suit your configuration
* git clone https://github.com/navgurukul/newton
* mv newton curriculum

**DB SETUP**
* Create a database, add the access credentials of the database to your `config` file
* Import schema.sql to import the database schema
* `bash courseUpdate.sh all` to import all the courses to your local database

**Run**
* *gulp build* (build ts files)
* *gulp tslint* (run tslint)
* *gulp watch* (watch ts files)
* *npm run start* (start the application)
* *npm run watch* (restart the application when files change)



**How to setup on windows**
* *git clone http://github.com/navgurukul/galileo*
* *cd galileo*
* *npm install -g typescript*
* *npm install -g ts-node* (required to run typescript)
* *npm install -g typings* (required for setup)
* *npm install yarn* (required for installing dev-dependencies)
* *yarn install* (install dependencies and dev-dependencies from package.json)
* *npm run setup* (install nuget packages & typings)
* Install python and setup it's enviroment variable for pip and python3.
* *pip install awscli* (required aws sdk)

**Configuration**
* Add enviroment variable GALILEO_ENV = 'dev' on windows.
* *cp src/configurations/sample-config.json src/configurations/config.dev.json.*
* **Get seprate AWS keyId and Secret Key to send email and upload images.**
* **Get Google Authentication keyId and secretKeyId.**
* Edit the contents of src/configurations/config.dev.json to suit your configuration.
* *git clone https://github.com/navgurukul/newton*
* *mv newton curriculum* (renaming the content folder).
* *aws configure* (to setup aws-sdk provide the keyId, SecretKey and region which has access to upload images to AWS).

**DB SETUP**
* Create a database *davinci*, add the access credentials of the database to your `config` file
* Import schema.sql to import the database schema
* `bash courseUpdate.sh all` to import all the courses to your local database

**Run**
* *gulp build* (build ts files and run linter)
* *gulp tslint* (run tslint)
* *gulp watch* (watch ts files)
* *npm run start* (start the application)
* *npm run watch* (restart the application when files change)




## Documentation
When the code is running, documentation is accessible at `localhost:5000/docs`.

## Our Git Workflow

### Main Branches
1. `master` is our holy grail. `master` and only `master` will ever be deployed to production environment.
2. `dev` is our playground (after we have perfected our code). `dev` will always be pushed to the staging environment.

### Workflow
1. All the development will take place in issue/feature specific branches. When starting a new branch, pull the new branch from master branch which will have the most stable code. You can do it from dev for the time being if the master is not upto date.
2. Create a pull request from the `issue specific branch` into `dev` which will be approved by someone who has the relevant access before being merged into dev.
3. After being merged into dev, we will deploy it to staging environment.

*We will make sure to have frequent merges from `dev` into `master` and release stuff into production*
