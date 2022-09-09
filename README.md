# Pulse Dashboard

[![Build Status](https://github.com/Recidiviz/pulse-dashboards/actions/workflows/build.yml/badge.svg)](https://github.com/Recidiviz/pulse-dashboards/actions) [![Coverage Status](https://coveralls.io/repos/github/Recidiviz/pulse-dashboards/badge.svg?branch=main)](https://coveralls.io/github/Recidiviz/pulse-dashboards?branch=main)

Bringing criminal justice analysis to decision makers to help reduce incarceration.

## Contents

1. [Development](#development)
1. [Deploys](#deploys)
1. [Tooling](#tooling)
1. [Application Structure](#application-structure)
1. [License](#license)

## Development

### Getting set up

1. Grab the source:

   `git clone git@github.com:Recidiviz/pulse-dashboards.git`

1. Ensure you are using the correct version of Node (if you don't use NVM, just check the .nvmrc file and ensure you are using that version).

   `nvm use`

1. Install Yarn package manager:

   `brew install yarn`

   For alternative Yarn installation options, see [Yarn Installation](https://yarnpkg.com/en/docs/install).

1. [Install Redis Version 4](https://redis.io/download#installation) (matches Memorystore for Redis version):

   Via Homebrew:
   `brew install redis@4.0`

   Using wget:

   ```sh
   :> wget https://download.redis.io/releases/redis-4.0.14.tar.gz
   :> tar xzf redis-4.0.14.tar.gz
   :> cd redis-4.0.14
   :> make

   <!-- Run redis with: -->
   :> src/redis-server

   <!-- Interact with Redis -->
   :> src/redis-cli
   ```

   [Instructions for installing Redis 4.0.14 on Windows](https://github.com/tporadowski/redis#redis-4014-for-windows)

1. Install dependencies:

   `yarn install`

That's it! We suggest installing a linting package for your preferred code editor that hooks into [eslint](#eslint). We recommend [linter-eslint](https://atom.io/packages/linter-eslint) for Atom.

#### Environment variables

Second and last, set up your environment variables.

For Recidiviz staff, download and unzip the `pulse_dashboard_env_vars.zip` from the shared 1Password vault and copy the files into the project directory.

IMPORTANT: Be sure to use `Shift+Command+.` in your Finder window to show the hidden files, and copy all of the files, including the hidden `.env` files. Follow the directory structure in the zip file, so if the file is nested in the `/src` directory in the zip, copy it into the `/src` directory in the repo.

For anyone trying to set this up independently, construct environment variables by hand based on the explanations below.

Explanation of frontend env files:

- `.env.frontend.example` - example file for frontend variables that are required
- `.env.development` - variables used during the staging deploy
- `.env.production` - variables used during the production deploy
- `.env.development.local` - variables used when the environment is started locally using `yarn dev`

Explanation of backend env files:

- `.env` - variables used for the backend API

Expected frontend environment variables include:

- `REACT_APP_API_URL` - the base URL of the backend API server.
- `REACT_APP_AUTH_ENV` - a string indicating the "auth environment" used to point to the correct Auth0 tenant. Either "development" or "production". Must match the backend `AUTH_ENV` variable.
- `REACT_APP_FEEDBACK_URL` - the URL of the Recidiviz Dashboard Feedback form.
- `REACT_APP_IS_DEMO (OPTIONAL)` - whether or not to run the frontend in demo mode, which will run the app without requiring authentication. This should only be set when running locally and should be provided through the command line, along with the backend sibling below. To run the app in demo mode, use the following command: `./run_in_demo_mode.sh`
- `REACT_APP_INTERCOM_APP_ID` - the APP_ID for Intercom, the customer engagement and support tool. Should be included in local, development, and production environments. The local and development environments point at the 'Recidiviz - [TEST]' Intercom workspace, and production environment points at the live 'Recidiviz' Intercom workspace.
- `REACT_APP_SENTRY_ENV` - The environment for reporting Sentry errors
- `REACT_APP_SENTRY_DSN` - The public DSN URL to use for sending Sentry errors, can be found on the Sentry project page.

Expected backend environment variables include:

- `AUTH_ENV` - a string indicating the "auth environment" used to point to the correct Auth0 tenant. Either "development" or "production". Must match the frontend `REACT_APP_AUTH_ENV` variable.
- `GOOGLE_APPLICATION_CREDENTIALS` - a relative path pointing to the JSON file containing the credentials of the service account used to communicate with Google Cloud Storage, for metric retrieval.
- `METRIC_BUCKET` - the name of the Google Cloud Storage bucket where the metrics reside.
- `IS_DEMO` (OPTIONAL) - whether or not to run the backend in demo mode, which will retrieve static fixture data from the `server/core/demo_data` directory instead of pulling data from dynamic, live sources. This should only be set when running locally and should be provided through the command line, along with the frontend sibling above. To run the app in demo mode, use the following command: `./run_in_demo_mode.sh`

The build process, as described below, ensures that the proper values are compiled and included in the static bundle at build time, for the right environment.

### Authentication

The backend API server and most frontend views in the app are authenticated via [Auth0](https://auth0.com/). You can control which views are authenticated by specifying `Route` versus `ProtectedRoute` in `src/App.js`. If you are setting this app up completely fresh, you will need to create your own Auth0 account.

This setup assumes you have two separate Auth0 tenants, one for lower tiers and one for production. The former should be configured in `auth_config_dev.json` and the latter in `auth_config_production.json`. Which file is loaded and used relies on the `AUTH_ENV` environment variable on the backend and the `REACT_APP_AUTH_ENV` environment variable on the frontend. It is important that the same config file be loaded on the backend and frontend servers in a given tier so that API authentication will work.

### Linting & running tests

A yarn script is available to run tests via [Jest](#jest):

`yarn test`

Running tests this way will also write code coverage statistics to stdout and the `coverage` directory.

If you would like to get your TDD on and run Jest in watch mode, you can use:

`yarn test:watch`

To run Jest manually:

`jest [optional-filepath]`

Linting is done with a combination of [eslint](#eslint) and [Prettier](#Prettier). `react-scripts` runs some minimal linting by default as part of its build process; errors on those linting rules will cause our build scripts to fail, but errors in our broader [configuration](https://github.com/Recidiviz/pulse-dashboards/.eslintrc.json) will not.

However, we have configured a pre-commit Git hook that prevents developers from committing code that fails our lint tests. It also auto-reformats that code as much as possible before executing the commit.

A yarn script is avilable to run lint tests:

`yarn lint`

This script also runs and must pass in the Github Actions test workflow.

To have eslint and Prettier fix violations automatically, run:

`yarn lint --fix`

To run eslint manually:

`eslint .`

> **Note**: we are gradually adding linting enforcement to our existing code, so not everything may be subject to linting yet. Refer to the [ignore file](https://github.com/Recidiviz/pulse-dashboards/.eslintignore) for details. While this transition is underway, if you are adding new files or substantially rewriting existing ones, you are encouraged to whitelist them for linting by updating the configuration file.

### Running the BackEnd application locally

To hit the backend API directly from localhost, you will need to run it in demo mode, which will fetch data files from the `server/core/demo_data` directory. This can be done with the following yarn script:

`yarn server:demo`

You can also run the backend locally to point to the GCS bucket (you may want to do this if you want to view the server and frontend logs separately):

`yarn server:dev`

This will start both the API Express server on port `3001` and the Redis server on port `6379`. You could start the frontend server separately using `yarn spa`.

### Running the FrontEnd application locally

A yarn script is available for starting the development servers. The React frontend is served out of port `3000` and the Node/Express backend is served out of port `3001`. A Redis server will be started on the default port `6379`. This will also automatically open a browser to localhost on the appropriate port, pointing to the frontend.

`yarn dev`

The development servers will remain active until you either close your terminal or shut down the entire setup at once using `control+c`.

**Note:** The development servers do not need to be restarted when source code is modified. The assets will automatically be recompiled and the browser will be refreshed (when there's a frontend change). Thanks, Webpack!

### Running the Frontend and Backend together in Demo mode

When running locally, you can run the app in demo mode to point the app to static data contained in `server/core/demo_data`. This is useful for debugging issues that materialize under specific data circumstances, for demonstrating the tool without exposing real data, for development when you don't have Internet access, and other use cases.

You can launch in demo mode locally via: `./run_in_demo_mode.sh`

Running via that command is important because environment variables are required for both the frontend and backend servers. Running with only one or the other in demo mode produces a fairly broken experience.

## Deploys

As noted above, the Dashboard is two components: a React frontend and a Node/Express backend providing a thin API. The app can be run locally, in staging, and in production. Deploying to staging and production are very similar, as described below.

### Deploying a Preview App for Frontend QA

Follow these steps to deploy a Firebase Preview App for QA:

1.  Build the staging app with `yarn build-staging`.
2.  Run `firebase hosting:channel:deploy PREVIEW_APP_NAME` (replace NAME with a string with no spaces like feature-pop, this name will be used to construct the URL)
3.  Access your Preview app at the provided URL, which will have the following pattern: `https://recidiviz-dashboard-stag-e1108--[PREVIEW_APP_NAME]-[random-hash].web.app`
4.  To update your preview URL with changes, run the same command again. Make sure to specify the same PREVIEW_APP_NAME in the command.
5.  When you're done with the preview app, delete it: `firebase hosting:channel:delete PREVIEW_APP_NAME`

[How to manage preview apps on Firebase](https://firebase.google.com/docs/hosting/manage-hosting-resources?authuser=0)

### Deploying to staging

#### Frontend

To generate a staging build of the frontend, invoke the following yarn script: `yarn build-staging`.

Each time this is run, the `build` directory will be wiped clean. A [bundle analysis](#Bundle-analysis) report, found in `build/report.html`, will also be generated on each invocation of this script. This will include the appropriate environment variables from `.env.development`.

You should then test this locally by running `firebase serve`: it will run the staging build locally, pointed to the staging API backend--if you also have backend changes, deploy the backend as described in the next subsection. When you're satisfied, deploy the frontend to staging with `firebase deploy -P staging`. Test vigorously on staging before deploying to production.

#### Backend

We deploy the backend to Google App Engine with configured yaml files. Copy the `gae.yaml.example` file into files named `gae-staging.yaml` and `gae-production.yaml`, and set environment variables accordingly.

Deploy the backend to staging Google App Engine with `gcloud app deploy gae-staging.yaml --project [project_id]`. This will upload any updated backend code/configuration to GAE and start the server (GAE runs `npm start` only once the deploy succeeds and is stable). Test vigorously on staging before continuing to production.

### Deploying to production

Follow the instructions described above, but with different commands for both frontend and backend deploys.

Generate a production build of the frontend with `yarn build`. Test locally with `firebase serve`. Deploy the frontend with `firebase deploy -P production`.

Deploy the backend to production GAE with `gcloud app deploy gae-production.yaml --project [project_id]`.

Test vigorously! Don't be afraid to rollback the deploy of frontend or backend through the Firebase and GAE consoles.

## Tests

### Running E2E tests

E2E feature specs are found in the `src/cucumber` directory. The tests are run using [WebDriverIO and Cucumber](https://webdriver.io/docs/frameworks#using-cucumber) and can be configured to run in a headless browser mode.

Configure HEADLESS mode by setting this variable in your `.env.development.local`: `RUN_TESTS_HEADLESS=true`.

The E2E tests are split between tests that can run on the demo server, and tests that can run on staging. The tests that are run on staging can be used to test the auth0 login flow and require additional environment variables set:

TEST_AUTH_USER=<a real auth0 email to test with>
TEST_AUTH_PASSWORD=

To run E2E tests that involve logging in:

1. Start your dev server: `yarn dev`
2. Run the test suite: `yarn test-e2e-lantern`

To run the E2E tests using a demo server:

1. Start your demo server: `REACT_APP_IS_DEMO=true yarn demo`
2. Run the test suite: `yarn test-e2e-users`

## Tooling

### Yarn

[Yarn](https://yarnpkg.com/en/) is a package manager for Node modules that is similar to npm but with [superior performance](https://github.com/pnpm/node-package-manager-benchmark). It is used to specify and install dependencies for the application. Adding a dependency is as simple as:

`yarn add package`

If the package is not required in production it should be added as a development dependency with the `--dev` flag:

`yarn add --dev package`

See the [Yarn documentation](https://yarnpkg.com/en/docs) for more details and a full list of commands available via the CLI.

### Redis

We use [Memorystore for Redis](https://cloud.google.com/memorystore/docs/redis/redis-overview) as an external cache for the backend API. When developing locally, the `redis-server` will be started with the `yarn server:demo` script.

Here are a few helpful commands for inspecting the local redis cache:

```bash
# Follow along with commands sent to the redis-server
:> redis-cli MONITOR

# Clear your local redis cache
:> redis-cli FLUSHALL

:> redis-cli
# List all the available keys in the cache
[localhost:6379]> KEYS *

# Get the value of the key
[localhost:6379]> GET key_name
```

### Webpack

[Webpack](https://webpack.js.org/) is a highly-configurable tool for compiling JavaScript modules. We use it to bundle all of our JavaScript, CSS, and static assets for efficient distribution in production.

Webpack has a reputation for being intimidating but don't let that deter you. The core idea of webpack is to specify a set of inputs (file types and locations), indicate how those inputs should be processed (via loaders and plugins), and specify how the resulting output should be generated. Check out the Webpack [Getting Started guide](https://webpack.js.org/guides/getting-started/) if you're interested in learning more.

#### Bundle analysis

We have configured `BundleAnalyzerPlugin` to facilitate bundle analysis. This can be useful for managing bundle bloat or spotting unnecessary dependencies. For convenience, a yarn script has been created to launch the bundle analyzer tool. To run this, execute the following command:

`yarn analyze-bundle`

**Note**: you will need to have either started the development server or executed a production build at least one time for this to work as the `build/report.html` file is generated during either of these actions.

### Jest

[Jest](https://facebook.github.io/jest/) is our testing framework. It provides a friendly testing API, a powerful and easy-to-use mocking functionality, and plenty of speed. Snapshot testing is also a nice feature but should be used with caution. It is served best as a supplement, rather than a substitute, of a robust set of unit tests that properly describes what a piece of code is intended to do.

To execute tests, see [Linting & running tests](#linting--running-tests).

To add new tests, create a file with the same name as the file you are testing and append the extension `.test.js`. This file should be located in the same directory as the file you are testing.

For example, if you are testing the `Recidiviz` component which is defined in `Recidiviz.js`, you would add tests in `Recidiviz.test.js`.

See Jest [API](https://facebook.github.io/jest/docs/en/api.html) and [Docs](https://facebook.github.io/jest/docs/en/getting-started.html) for more information.

### Enzyme

[Enzyme](http://airbnb.io/enzyme/) is a utility for unit testing React components. It's particularly handy for its ability to shallow render a component for isolated testing, fully mount a component to test lifecycle methods, select elements in a variety of ways with ease, and simulate events to test handlers.

See Enzyme [API](http://airbnb.io/enzyme/docs/api/) for more information.

### eslint

[eslint](https://eslint.org/) is a flexible linter for JavaScript. We have configured eslint to adhere to the Airbnb style guides for [Javascript](https://github.com/airbnb/javascript) and [React](https://github.com/airbnb/javascript/tree/master/react), with a few [exceptions](https://github.com/Recidiviz/pulse-dashboards/.eslintrc.json), in addition to the base eslint JS rules.

To run the linter, see [Linting & running tests](#linting--running-tests).

We suggest installing a linting package for your preferred code editor that hooks into eslint. This will allow you to get real time feedback on code while you're writing it. We recommend [linter-eslint](https://atom.io/packages/linter-eslint) for Atom.

### Prettier

[Prettier](https://prettier.io/) is a code formatter that we use to enforce JavaScript code style. We have integrated it with our linting tools and configured it run automatically on code before it can be committed. For more information, see [Linting & running tests](#linting--running-tests).

We suggest installing a Prettier integration for your preferred code editor that will format your code as you write it (they can generally be set to reformat open files as you save them). For example, [prettier-atom](https://atom.io/packages/prettier-atom) for Atom.

### React

[React](https://reactjs.org/) is a JavaScript framework for building user interfaces. Unlike some other popular JS frameworks, it focuses exclusively on the view layer and is agnostic as to your choices for other parts of your application.

React [documentation](https://reactjs.org/docs/hello-world.html) is very high quality and helpful for getting started.

## Application Structure

A quick overview of the directory structure and suggestions on where to put different things.

```
/build/
/public/
/src/
  assets/
  auth0/
  AuthWall/
  components/
  constants/
  contexts/
  controls/
  core/
  cucumber/
  hooks/
  lantern/
  RootStore/
  utils/
  App.js
  index.js
/server/
   server.js
```

### Application root (/)

Home to files such as `server.js`, for running the backend server, and `package.json` for configuring build, dependencies, etc. Files in the application root are generally not bundled by Webpack.

### build

The bundled, static frontend. This is what gets exposed on the public frontend server.

### public

These are the raw public assets that form the _website itself_, i.e. `index.html` and the Favicon. When a build is generated, the contents of `src` are combined with the contents of `public` to generate `build`.

### src

Application frontend source code. If you're writing it, it should most likely end up here or in `/server` below.

#### src/assets

This is where frontend assets should live. JS logic, e.g. for creating exported images and json files of a given visualization, should live in `src/assets/scripts`. Static assets and style sheets should live in `src/assets/static` and `src/assets/styles`, respectively.

#### src/components

All React components that are shared across Lantern and UP dashboards exist under this directory. Any new additions should be added using Typescript.

#### src/controls

Shared UI components that can be reused across Lanterna and UP dashboards.

#### src/core

This is where all components and stores for the UP dashboard live.

#### src/cucumber

Cucumber feature tests and test support for E2E tests.

#### src/lantern

This is where all components and stores for the Lantern dashboard live.

#### src/RootStore

The root store for both UP and Lantern dashboards. This store initializes the UserStore and TenantStore.

#### src/App.js and src/index.js

`App.js` is where the primary application view is defined, i.e. the central page layout and the frontend routing. `index.js` is the actual entry point to the frontend, i.e. where the `ReactDOM` is rendered.

#### src/utils

Application configuration files, constants, utilities shared across both Lantern and UP dashboards.

### server

Application backend source code. If you're writing it, it should most likely end up here or in `/src` above.

### server.js

The actual entry point to the backend, i.e. where the Node/Express server, middleware, and routing are defined.

## License

This project is licensed under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
