# galileo
Made using hapi.js, the repository use mysql database.

## How to Run?

**Installation**

* *npm install -g typings* (required for setup)
* *npm install yarn* (required for installing dev-dependencies)
* *yarn install* (install dependencies and dev-dependencies from package.json)
* *npm run setup* (install nuget packages & typings)

**Configuration**
* export GALILEO='dev'
* cp src/configurations/sample-config.json src/configurations/config.dev.json
* Edit the contents of src/configurations/config.dev.json to suit your configuration
* git clone https://github.com/navgurukul/newton
* mv newton curriculum

**Run**
* *node_modules/gulp/bin/gulp.js build* (build ts files)
* *node_modules/gulp/bin/gulp.js tslint* (run tslint)
* *node_modules/gulp/bin/gulp.js watch* (watch ts files)
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

`I have never met a man so ignorant that I couldn't learn something from him. ~ Galileo`
