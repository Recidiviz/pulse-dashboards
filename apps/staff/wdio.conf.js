// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const firebase = require("../../firebase.json");

global.downloadDir = path.join("/tmp", "tempDownloads");

exports.config = {
  credentials: {
    admin: {
      username: process.env.TEST_AUTH_USER,
      password: process.env.TEST_AUTH_PASSWORD,
    },
    restrictedAccessUser1: {
      username: process.env.TEST_AUTH_RESTRICTED_ACCESS_USER_1,
      password: process.env.TEST_AUTH_RESTRICTED_ACCESS_USER_1_PASSWORD,
    },
    restrictedAccessUser2: {
      username: process.env.TEST_AUTH_RESTRICTED_ACCESS_USER_2,
      password: process.env.TEST_AUTH_RESTRICTED_ACCESS_USER_2_PASSWORD,
    },
  },
  //
  // ====================
  // Runner Configuration
  // ====================
  //
  // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
  // on a remote machine).
  runner: "local",
  //
  // ==================
  // Specify Automation Protocol
  // ==================
  //
  // Use devtools protocol to use Puppeteer instead of Chromedriver/Selenium
  automationProtocol: "devtools",
  //
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // from which `wdio` was called.
  specs: ["./src/cucumber/features/*.feature"],

  // Define specific test suites
  suites: {
    login: ["./src/cucumber/features/login.feature"],
    lantern: ["./src/cucumber/features/lantern/*.feature"],
    userAccess: ["./src/cucumber/features/lantern/userAccessLevels/*.feature"],
    workflows: ["./src/cucumber/features/workflows/*.feature"],
  },
  // Patterns to exclude.
  exclude: [
    // 'path/to/excluded/files'
  ],
  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: 1,
  capabilities: [
    {
      // maxInstances can get overwritten per capability.
      maxInstances: 1,
      browserName: "chrome",
      "goog:chromeOptions": {
        prefs: {
          // Set up safeBrowsing and download preferences for downloading files headless
          safebrowsing: {
            enabled: false,
            disable_download_protection: true,
          },
          download: {
            directory_upgrade: true,
            prompt_for_download: false,
            default_directory: global.downloadDir,
          },
        },
        args:
          process.env.RUN_TESTS_HEADLESS === "true"
            ? [
                "--headless",
                "--no-sandbox",
                "--window-size=1280,800",
                "--disable-gpu",
              ]
            : [],
      },
    },
  ],
  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  logLevel: "warn",
  //
  // Set specific log levels per logger
  // loggers:
  // - webdriver, webdriverio
  // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
  // - @wdio/mocha-framework, @wdio/jasmine-framework
  // - @wdio/local-runner
  // - @wdio/sumologic-reporter
  // - @wdio/cli, @wdio/config, @wdio/sync, @wdio/utils
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  // logLevels: {
  //     webdriver: 'info',
  //     '@wdio/applitools-service': 'info'
  // },
  //
  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,
  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: "http://localhost:3000",
  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 10000,
  //
  // Default timeout in milliseconds for request
  // if browser driver or grid doesn't send response
  connectionRetryTimeout: 120000,
  //
  // Default request retries count
  connectionRetryCount: 3,
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  services: ["devtools"],
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: "cucumber",
  //
  // The number of times to retry the entire specfile when it fails as a whole
  specFileRetries: 3,
  //
  // Delay in seconds between the spec file retry attempts
  // specFileRetriesDelay: 0,
  //
  // Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
  // specFileRetriesDeferred: false,
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter
  reporters: ["spec"],

  //
  // If you are using Cucumber you need to specify the location of your step definitions.
  cucumberOpts: {
    // <string[]> (file/dir) require files before executing features
    require: [
      "./src/cucumber/steps/**/*.js",
      "./src/cucumber/features/support/*.js",
    ],
    // <boolean> show full backtrace for errors
    backtrace: false,
    // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    requireModule: ["@babel/register"],
    // <boolean> invoke formatters without executing steps
    dryRun: false,
    // <boolean> abort the run on first failure
    failFast: false,
    // <string[]> (type[:path]) specify the output format, optionally supply PATH to redirect formatter output (repeatable)
    format: ["pretty"],
    // <boolean> hide step definition snippets for pending steps
    snippets: true,
    // <boolean> hide source uris
    source: true,
    // <string[]> (name) specify the profile to use
    profile: [],
    // <boolean> fail if there are any undefined or pending steps
    strict: false,
    // <string> (expression) only execute the features or scenarios with tags matching the expression
    tagExpression: "",
    // <boolean> add cucumber tags to feature or scenario name
    tagsInTitle: true,
    // <number> timeout for step definitions
    timeout: 60000,
    // <boolean> Enable this config to treat undefined definitions as warnings.
    ignoreUndefinedDefinitions: false,
  },

  //
  // =====
  // Hooks
  // =====
  // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
  // it and to build services around it. You can either apply a single function or an array of
  // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
  // resolved to continue.
  /**
   * Gets executed once before all workers get launched.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   */
  onPrepare() {
    // make sure download directory exists
    if (!fs.existsSync(global.downloadDir)) {
      // if it doesn't exist, create it
      fs.mkdirSync(global.downloadDir);
    }
    // make sure the opportunity pages config exists
    execSync("vite-node tools/makeOpportunityPageConfig.ts");
  },
  /**
   * Gets executed before a worker process is spawned and can be used to initialise specific service
   * for that worker as well as modify runtime environments in an async fashion.
   * @param  {String} cid      capability id (e.g 0-0)
   * @param  {[type]} caps     object containing capabilities for session that will be spawn in the worker
   * @param  {[type]} specs    specs to be run in the worker process
   * @param  {[type]} args     object that will be merged with the main configuration once worker is initialised
   * @param  {[type]} execArgv list of string arguments passed to the worker process
   */
  // onWorkerStart: function (cid, caps, specs, args, execArgv) {
  // },
  /**
   * Gets executed just before initialising the webdriver session and test framework. It allows you
   * to manipulate configurations depending on the capability or spec.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that are to be run
   */
  // beforeSession: function (config, capabilities, specs) {
  // },
  /**
   * Gets executed before test execution begins. At this point you can access to all global
   * variables like `browser`. It is the perfect place to define custom commands.
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs        List of spec file paths that are to be run
   * @param {Object}         browser      instance of created browser/device session
   */
  // before: function (capabilities, specs) {
  // },
  /**
   * Runs before a WebdriverIO command gets executed.
   * @param {String} commandName hook command name
   * @param {Array} args arguments that command would receive
   */
  // beforeCommand: function (commandName, args) {
  // },
  /**
   * Runs before a Cucumber feature
   */
  // beforeFeature: function (uri, feature) {
  // },
  /**
   * Runs before a Cucumber scenario
   * @param world
   */
  async beforeScenario(world) {
    /* Reset the database after each scenario for tests running on offline mode */

    /* Do not load offline fixtures if scenario logs in thru auth0 */
    const { tags } = world.pickle;
    const tagNames = tags.map((t) => t.name);
    if (
      tagNames.includes("@reload-session") ||
      tagNames.includes("@skip-offline-fixtures")
    )
      return;

    /* Delete all data from emulator project */
    execSync(
      `curl -v -X DELETE 'http://localhost:${firebase.emulators.firestore.port}/emulator/v1/projects/${process.env.FIREBASE_PROJECT}/databases/(default)/documents'`,
    );
    /* Load fixtures to firestore database */
    execSync(`vite-node tools/loadWorkflowsFixtures.ts --quiet`);
  },
  /**
   * Runs before a Cucumber step
   */
  // beforeStep: function (step, context) {
  // },
  /**
   * Runs after a Cucumber step
   */
  // afterStep: function (step, context) {
  // },
  /**
   * Runs after a Cucumber scenario
   */

  afterScenario: async function (world) {
    const { tags } = world.pickle;
    const { status } = world.result;
    const tagNames = tags.map((t) => t.name);

    // Remove test files after each scenario
    if (tagNames.includes("@remove-temp-directory") && status === "PASSED") {
      fs.rmSync(global.downloadDir, { force: true, recursive: true });
    }

    /* For tests that do not run on offline mode, we need to reload the session after authentication. */
    if (tagNames.includes("@reload-session")) {
      await browser.reloadSession();
    }
  },
  /**
   * Runs after a Cucumber feature
   */
  // afterFeature: function (uri, feature) {
  // },

  /**
   * Runs after a WebdriverIO command gets executed
   * @param {String} commandName hook command name
   * @param {Array} args arguments that command would receive
   * @param {Number} result 0 - command success, 1 - command error
   * @param {Object} error error object if any
   */
  // afterCommand: function (commandName, args, result, error) {
  // },
  /**
   * Gets executed after all tests are done. You still have access to all global variables from
   * the test.
   * @param {Number} result 0 - test pass, 1 - test fail
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that ran
   */
  // after: function (result, capabilities, specs) {
  // },
  /**
   * Gets executed right after terminating the webdriver session.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that ran
   */
  // afterSession: function (config, capabilities, specs) {
  // },
  /**
   * Gets executed after all workers got shut down and the process is about to exit. An error
   * thrown in the onComplete hook will result in the test run failing.
   * @param {Object} exitCode 0 - success, 1 - fail
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {<Object>} results object containing test results
   */
  // onComplete: function(exitCode, config, capabilities, results) {
  // },
  /**
   * Gets executed when a refresh happens.
   * @param {String} oldSessionId session ID of the old session
   * @param {String} newSessionId session ID of the new session
   */
  // onReload: function(oldSessionId, newSessionId) {
  // }
};
