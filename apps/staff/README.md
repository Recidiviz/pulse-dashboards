# Pulse Dashboard

Bringing criminal justice analysis to decision makers to help reduce incarceration.

## Contents

1. [Development](#development)
1. [Deploys](#deploys)
1. [Tooling](#tooling)
1. [Application Structure](#application-structure)
1. [License](#license)

## Development

### Environment variables

Environment variables, auth configs, and service accounts are stored in Google Secrets Manager and loaded into the environment prior to launching or deploying the app.

To update a secret:

1. Go to the [recidiviz-dashboard-staging GSM](https://console.cloud.google.com/security/secret-manager?project=recidiviz-dashboard-staging)
1. Find the secret where the env/var or config that needs to be updated is stored. All of the secrets that contain environment variables or environment config start with `env_`
1. Copy the existing value (to be edited or added to when creating the new version). Since there are usually multiple env vars that live in a single secret, this step is necessary before moving on to the next step.
1. Create a new version of the secret with an updated value

For anyone trying to set this up independently, construct environment variables by hand based on the explanations below.

Expected frontend environment variables include:

- `VITE_API_URL` - the base URL of the backend API server.
- `VITE_AUTH_ENV` - a string indicating the "auth environment" used to point to the correct Auth0 tenant. Either "development" or "production". Must match the backend `AUTH_ENV` variable.
- `VITE_FEEDBACK_URL` - the URL of the Recidiviz Dashboard Feedback form.
- `VITE_IS_OFFLINE (OPTIONAL)` - whether or not to run the frontend in offline mode, which will run the app without requiring authentication. This should only be set when running locally and should be provided through the command line, along with the backend sibling below. To run the app in offline mode, run `yarn offline`
- `VITE_INTERCOM_APP_ID` - the APP_ID for Intercom, the customer engagement and support tool. Should be included in local, development, and production environments. The local and development environments point at the 'Recidiviz - [TEST]' Intercom workspace, and production environment points at the live 'Recidiviz' Intercom workspace.
- `VITE_SENTRY_ENV` - The environment for reporting Sentry errors
- `VITE_SENTRY_DSN` - The public DSN URL to use for sending Sentry errors, can be found on the Sentry project page.
- `VITE_DEPLOY_ENV` - The current deploy environment: `production`, `staging`, or `dev`
- `VITE_NEW_BACKEND_API_URL` - URL of the new Pathways backend
- `VITE_CRYPTO_PASSPHRASE` - Used to encrypt/decrypt salted hash ids
- `VITE_FIREBASE_BACKEND_PROJECT` - Name of the GCP project where Firebase is hosted
- `VITE_FIREBASE_API_KEY` - API Key to access Firebase
- `VITE_SENTENCING_API_BASE` - base URL of the sentencing backend API server
- `VITE_PROTOTYPES_API_URL` - base URL of the prototypes backend API server

The build process, as described below, ensures that the proper values are compiled and included in the static bundle at build time, for the right environment.

### Authentication

The backend API server and most frontend views in the app are authenticated via [Auth0](https://auth0.com/). You can control which views are authenticated by specifying the allowed paths in `ProtectedLayout.tsx`. If you are setting this app up completely fresh, you will need to create your own Auth0 account.

This setup assumes you have two separate Auth0 tenants, one for staging/demo/development and one for production. Configs live in `~staff-shared-server`. Which config is loaded and used relies on the `AUTH_ENV` environment variable on the backend and the `VITE_AUTH_ENV` environment variable on the frontend. It is important that the same config be loaded on the backend and frontend servers in a given tier so that API authentication will work.

### Nx

This application is an [Nx project](https://nx.dev/concepts/mental-model#the-project-graph) with the name "staff"; all scripts referred to in this document should be run from the root of the repository, and they assume you have Nx globally installed (this is not a requirement; just sub `yarn nx` for `nx` to run them with the local Nx installation)

### Linting & running tests

A package.json script is available to run tests via [Jest](#jest):

`nx test staff`

This will actually run several separate sub-commands, each of which can also be run on its own (this is usually more practical during active development); e.g. `nx test-react staff`. Arguments will be passed through to the Jest CLI.

Static code analysis is done with a combination of Typescript and [ESLint](#eslint), and we have configured a pre-commit Git hook that prevents developers from committing code that fails our lint tests. It also auto-reformats that code as much as possible before executing the commit, using a combination of ESLint-autofixing and [Prettier](#prettier).

Scripts:

`nx lint staff` (pass `--fix` to have ESLint autofix what it can)

`nx typecheck staff`

There is no script for Prettier; formatting changes will be applied by the pre-commit hook (and by your code editor, if you have a Prettier plugin installed) and you should generally just not have to think about it.

### Syncing content

Content found in the folder `src/core/content` can be synced with an external google sheet by running `nx sync-content staff`. The ID of the sheet as well as the credentials of a service account with access credentials should be loaded into the environment using the vars specified below as part of the `nx sync-content staff` command.

- `CONTENT_SHEET_ID` - Id of the Google Sheet where the content is stored
- `SHEET_API_SERVICE_ACCOUNT` - Service account used to authenticate/authorize access to the sheet
- `SHEET_API_SERVICE_ACCOUNT_KEY` - API key used to access the Google Sheet

### Running the application locally

A script is available for starting the development servers.

`nx dev staff`

This will start both the frontend dev server and a local backend from `~staff-shared-server`. You could start the frontend server on its own using using `nx dev-spa staff`.

API calls to the Python backend are made to the staging version of the app.

The development servers will remain active until you either close your terminal or shut down the entire setup at once using `control+c`.

### Running the application locally with a local Python backend

If you have not run the Python server (fka "Case Triage backend", fka "new Pathways backend") locally before, run (from your `recidiviz-data` repository):

`./recidiviz/tools/case_triage/initialize_development_environment.sh`

This script also may need to be rerun periodically when new secrets are added to it.

Then, to run the new backend locally, run (also from your `recidiviz-data` repository):

`docker compose -f docker-compose.yaml -f docker-compose.case-triage.yaml up --remove-orphans`

If you get errors about not having access to containers, you may need to run `gcloud auth login` and `gcloud auth configure-docker` first to authenticate with the Google Cloud registry.

If you use a Mac, you may need to turn off AirPlay Receiver in System Preferences --> Sharing in order to make port 5000 available.

To create the required databases and add data to them, use the [load_fixtures](https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/tools/pathways/load_fixtures.py) script (see instructions and sample usage in the file). Data is persisted even when the container is stopped, so the script does not need to be run every time you start the container.

**Tip:** To inspect and/or edit the database contents locally, you can use a GUI like [Postico](https://eggerapps.at/postico/), and connect to the `postgres` database using the host/user/password defined in [docker-compose.yaml](https://github.com/Recidiviz/recidiviz-data/blob/62210d3ebab17c4424abcb17395989f1209e8f0e/docker-compose.yaml#L87-L91). If you edit the contents manually, run the [reset_cache](https://github.com/Recidiviz/recidiviz-data/blob/main/recidiviz/tools/pathways/reset_cache.py) script to update the cache with the new contents.

To run the frontend against a local Python backend, run (now from `pulse-dashboards`):

`nx dev-be staff`

### Running the application locally and fetching from the Demo GCS bucket

Similarly to running the application locally, the application can be run but the Backend will fetch from a Demo GCS bucket, where all of the data is anonymized and randomized. Non-recidiviz employees should use this option.

`nx demo staff`

Similar to the `dev` command, this will start both the frontend and backend servers.

### Running the Frontend and Backend together in Offline mode

When running locally, you can run the app in offline mode to point the app to static data contained in `server/core/demo_data`. This is useful for debugging issues that materialize under specific data circumstances, for development when you don't have Internet access, and other use cases.

You can launch in offline mode locally via: `nx offline staff`

If you are running in offline mode, you may need to run through the following steps first:

1. Ensure that your environment is set up correctly by following steps 1 - 9 in the [Set Up Your Frontend Development doc](https://docs.google.com/document/d/1y-yJwZN6yM1s5OKqTDCk56FN2p7ZA62buwph1YdnJAc/edit). Check the `.nvmrc` to see the latest Node version you'll need to install and use.
1. Make sure your local repository has all the latest changes from the main branch. Run the following git commands from the `pulse-dashboards/` directory:

   ```
   :> git checkout main
   :> git pull origin main
   ```

1. Make sure you can run the Firebase emulator; this requires Firebase Tools as described above as well as a recent version of Java.
   The Firebase emulator has its own set of fixtures that it automatically imports when starting up; to change those fixtures, edit the fixture files in `tools/fixtures` and then run `nx update-workflows-fixture staff`.

1. Follow any setup steps for Offline Mode in `/libs/staff-shared-server`

### Running the Frontend and Backend together in Offline mode with the Python backend

Similar to dev mode, in offline mode we do not run the Python backend locally by default. If you are working on features that require this backend, you can run it along with the rest of offline mode with `nx offline-python staff`. (Because it runs in Docker Compose, after stopping the server with Ctrl-C you can also run `nx python-backend-shutdown staff-shared-server` to clean it up.)

It is possible that the frontend finishes loading before the backend has finished setting up. If that happens, you may see a "no data available" indicator in the frontend and/or failed requests in the console. To fix this, wait for the container output to display the message "finished initializing pathways database" and refresh the page (this should take no more than a minute).

To swap out the backend for a specific metric, set its id to "OLD" or "NEW in the development `metricBackendOverrides` section in [flags.ts](./src/flags.ts) ("NEW" indicates the Python backend). To swap out the backend for all supported metrics, change the `defaultMetricBackend` to "OLD" or "NEW".

The offline version of the Pathways backend is managed by `libs/staff-shared-server`, please see documentation in that library for additional information and troubleshooting.

## Deploys

As noted above, the Dashboard is two components: a React frontend and a Node/Express backend providing a thin API. The app can be run locally, in staging, in demo, and in production. Deploying to demo, staging and production are very similar, as described below.

### Deploying to staging, demo, preview and production

To deploy the frontend or backend to any of these environments, run `nx deploy staff` and follow the prompts. This automatically downloads the appropriate environment files from Secret Manager, bundles the application (for frontend), lets you preview (for frontend), and generates release notes (for production).

Things to note:

- Each time the frontend is bundled, the `build` directory will be wiped clean. A [bundle analysis](#bundle-analysis) report, found in `build/report.html`, will also be generated. This will include the appropriate environment variables that were downloaded from Secret Manager.
- The Python backend is deployed to the Case Triage Cloud Run service during the `recidiviz-data` deploy. New versions can be deployed manually in the Cloud Console, but this should only be done sparingly.
- Test vigorously on staging before deploying to production, and don't be afraid to rollback the deploy of frontend or backend through the Firebase and GAE consoles.

### Cherry-pick deploys

In order to cherry-pick or revert:

- Checkout the desired release branch. The relevant release branch should follow the `releases/vXX.YY.ZZ` naming convention and should be listed in the Branches UI [here](https://github.com/Recidiviz/pulse-dashboards/branches). You can also find the version number of a release via the Firebase console [here](https://console.firebase.google.com/u/0/project/recidiviz-dashboard/hosting/sites/recidiviz-dashboard?pli=1), then use the aforementioned name convention to get the release branch.
- Create a new branch.
- Revert or cherry-pick the desired commit onto the new branch. For a detailed description of these steps, follow the steps in the 'Cherry-pick flow' section [here](https://github.com/Recidiviz/recidiviz-data/wiki/Code-Versioning-and-Release-Process#cherry-pick-flow) up to, but not including, 'All scenarios'.

Once you've pushed the branch with the changes, create a PR for the change and set the base as the release branch selected earlier. Merge the change once approved. To deploy this change, switch to the release branch and pull the changes. Then deploy to production via the deploy script as normal, but be sure to select that this is a cherry-pick deploy when asked.

#### Firestore rules

Firestore security rules and their tests are found in `./firestore-config`. Changes can be deployed with `nx update-rules-staging staff` or `nx update-rules-production staff`.

#### Deploy cadence

In most cases, deploys are run by the on-call engineer. The standard schedule is for `main` to be deployed to staging every workday afternoon, and for production+demo deploys twice a week (usually Tuesday and Thursday afternoons) promoting the version that was on staging overnight. Frontend and backend are always deployed simultaneously to ensure that everything remains in sync.

To keep the deploy process running smoothly, it's good practice to put breaking changes / new functionality that is expected to launch on a specific date behind feature variants so they can be turned on and off separately from the code deploy. Never knowingly put `main` in a state that can't be released to production.

If there is an emergency fix that needs to go to production before the next scheduled deploy, run a [cherry-pick deploy](#cherry-pick-deploys). (If nothing but the fix has been merged to main since the last prod deploy, it's fine to just run normal staging and prod deploys instead.)

## Tests

### Running E2E tests

We currently use two frameworks for our e2e tests. The users, login, Workflows, and Lantern e2e tests use Cucumber. Insights e2e tests use Playwright. We may try to eventually port all tests over to Playwright, but for now they are split across the two frameworks and are run using different scripts.

#### Cucumber specs

The Cucumber E2E feature specs are found in the `src/cucumber` directory. The tests are run using [WebDriverIO and Cucumber](https://webdriver.io/docs/frameworks#using-cucumber) and can be configured to run in a headless browser mode.

Configure HEADLESS mode by setting this variable in your shell environment before running the tests: `RUN_TESTS_HEADLESS=true`.

The E2E tests run on the dev server, with the "e2e" environment set, and can be used to test the auth0 login flow and require additional environment variables set:

TEST_AUTH_USER=<a real auth0 email to test with>
TEST_AUTH_PASSWORD=
TEST_AUTH_RESTRICTED_ACCESS_USER_1=<a real auth0 email with restricted access>
TEST_AUTH_RESTRICTED_ACCESS_USER_1_PASSWORD=
TEST_AUTH_RESTRICTED_ACCESS_USER_2=<a real auth0 email with restricted access>
TEST_AUTH_RESTRICTED_ACCESS_USER_2_PASSWORD=

To run E2E tests that involve logging in:

1. Start your dev server: `nx dev staff`
2. Run the test suites: `nx test-e2e-lantern staff` or `nx test-e2e-login staff` or `nx test-e2e-users staff`

To run E2E tests that do not involve logging in:

1. Start the offline server `nx offline staff`
2. Run the test suites: `nx test-e2e-workflows staff`

#### Playwright specs

The Playwright feature specs are found in the `/e2e` directory. The tests are run using [Playwright](https://playwright.dev/), and can be run from the command line, or using a plugin installed on your IDE.

These tests run on the offline server.

First install the Playwright tools
`npx install playwright`

To run the Playwright E2E tests from your command line:

1. Start the offline server `nx offline staff`
1. Run the tests: (headless) `nx e2e staff` or (headed) `nx e2e staff --headed`

To run the Playwright E2e tests from your IDE:

1. Start the offline server `nx offline staff`
1. Follow the instructions [here](https://playwright.dev/docs/getting-started-vscode) to run, debug, or record new tests.

## Tooling

### Yarn

[Yarn](https://yarnpkg.com/en/) is a package manager for Node modules that is similar to npm but with [superior performance](https://github.com/pnpm/node-package-manager-benchmark). It is used to specify and install dependencies for the application. Adding a dependency is as simple as:

`yarn add <package>`

If the package is not required in production it should be added as a development dependency with the `--dev` or `-D` flag:

`yarn add --dev <package>`

See the [Yarn documentation](https://yarnpkg.com/en/docs) for more details and a full list of commands available via the CLI.

### Vitest

[Vitest](https://vitest.dev/) is our testing framework. It provides a friendly testing API, a powerful and easy-to-use mocking functionality, and plenty of speed. Snapshot testing is also a nice feature but should be used with caution. It is served best as a supplement, rather than a substitute, of a robust set of unit tests that properly describes what a piece of code is intended to do.

To execute tests, see [Linting & running tests](#linting--running-tests).

To add new tests, create a file with the same name as the file you are testing and append the extension `.test.ts`. This file should be located in the same directory as the file you are testing.

For example, if you are testing the `Recidiviz` component which is defined in `Recidiviz.js`, you would add tests in `Recidiviz.test.ts`.

See Vitest [API](https://vitest.dev/api/) and [Docs](https://vitest.dev/guide/) for more information.

### eslint

[eslint](https://eslint.org/) is a flexible linter for JavaScript.

To run the linter, see [Linting & running tests](#linting--running-tests).

We suggest installing a linting package for your preferred code editor that hooks into eslint. This will allow you to get real time feedback on code while you're writing it. We recommend [the ESLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

### Prettier

[Prettier](https://prettier.io/) is a code formatter that we use to enforce JavaScript code style. We have configured it run automatically on code before it can be committed. For more information, see [Linting & running tests](#linting--running-tests).

We suggest installing a Prettier integration for your preferred code editor that will format your code as you write it (they can generally be set to reformat open files as you save them). For example,[the Prettier - Code Formatter extension for VS Code](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).

### React

[React](https://reactjs.org/) is a JavaScript framework for building user interfaces. Unlike some other popular JS frameworks, it focuses exclusively on the view layer and is agnostic as to your choices for other parts of your application.

React [documentation](https://react.dev/) is helpful for getting started.

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
/tools/
```

### Application root (/)

Home to files such as `package.json` for configuring build, dependencies, etc. Files in the application root are generally not bundled by our build tooling.

### public

These are the raw public assets that form the _website itself_, i.e. `index.html` and the Favicon. When a build is generated, the contents of `src` are combined with the contents of `public` to generate `build`.

### src

Application frontend source code. If you're writing it, it should most likely end up here, or in a library imported here.

#### src/assets

This is where frontend assets should live. JS logic, e.g. for creating exported images and json files of a given visualization, should live in `src/assets/scripts`. Static assets and style sheets should live in `src/assets/static` and `src/assets/styles`, respectively.

#### src/auth0

Code for our Auth0 Actions is kept here for reference and review purposes. It is not included in the application bundle, nor is it directly deployed to Auth0 from here. Live Action deployments are done manually via the Auth0 Dashboard.

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

### tools

This is where scripts which help with development but do not need to be shipped with the app live.

## License

This project is licensed under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
