# E2E Testing Guide 

# Tools and Documentation Links

## WebDriverIO (wdio)

[WebDriverIO](https://webdriver.io/) is the automation framework that uses Puppeteer under the hood to run tests in a browser. It can be run headless by changing the environment variable RUN_TESTS_HEADLESS in the .env.offline file.

The [configuration for WDIO](https://webdriver.io/docs/configuration) can be found in the root of the project in the wdio.conf.js file. For example, we specify that we want to use Puppeteer (instead of Selenium or Chromedriver) by setting the automationProtocol config file to use the [devtools](https://webdriver.io/docs/automationProtocols#devtools-protocol) protocol.

There are several packages required to run WDIO:

- [@wdio/cli](https://webdriver.io/docs/testrunner) - This is the WDIO testrunner needed to run the tests using npx wdio run
- [@wdio/cucumber-framework](https://webdriver.io/docs/frameworks#using-cucumber) - Cucumber adapter package
- [@wdio/devtools-service](https://webdriver.io/docs/devtools-service) - Additional helper utilities for accessing puppeteer from the browser object
- [@wdio/local-runner](https://webdriver.io/docs/runner#local-runner) - Default test runner for WDIO
- [@wdio/spec-reporter](https://webdriver.io/docs/spec-reporter/) - Reporter for test results

**Links**

- [Link to Selectors Docs](https://webdriver.io/docs/selectors/#element-with-certain-text)
- [Link to Browser Object API ](https://webdriver.io/docs/api/browser)
- [Link to Element Object API](https://webdriver.io/docs/api/element)

## Cucumber

[Cucumber](https://cucumber.io/docs/installation/javascript/) [](https://cucumber.io/docs/installation/javascript/) (@cucumber/cucumber) supports [Behavior-Driven Development](https://cucumber.io/docs/bdd/), and we are using it to help us write clear, easy to read feature tests. Cucumber reads executable specifications written in plain text that include examples and scenarios, specifically using the key words to build scenarios: Given, When, Then, But, and And. Each scenario is a list of _steps_ and the basic syntax rules are called [Gherkin](https://cucumber.io/docs/gherkin/).

Here's an example:

```
Scenario: User marks client as ineligible
  Given a user from Tennessee on the opportunity form page
  When the user opens the denial dropdown
  And clicks on a denial option
  Then the client will be marked as ineligible
  And the client's status will be updated
```

Other primary keywords include: Feature, Rule, Example, Background, Scenario Outline, Examples.

**Links**

- [Link to Gherkin Reference](https://cucumber.io/docs/gherkin/)
- [Link to Step Definitions](https://cucumber.io/docs/cucumber/api/?lang=javascript)

## Jest Expectations

We use [Jest expectations](https://jestjs.io/docs/expect) in the step definitions to assert the test results.

# WDIO Config

## Capabilities

# Running E2E Tests

## Locally

When you run tests locally, you can choose to run them within a browser or headless. The configuration for that is found in the .env-cmdrc file under the key e2e.RUN_TESTS_HEADLESS.

**Run each E2E suite individually**

- Lantern tests: `yarn run test-e2e-lantern`

- Lantern user permissions tests: `yarn run test-e2e-users`

- Auth0 login tests: `yarn run test-e2e-login`

- Workflows tests: `yarn run test-e2e-workflows`

**Run a single test locally**

`npx env-cmd -f .env.offline wdio ./wdio.conf.js --spec src/cucumber/features/path/to/feature/test`

Example:

`npx env-cmd -f .env.offline wdio ./wdio.conf.js --spec src/cucumber/features/workflows/caseloadSearch.feature`

## On CI

Workflows E2E tests are run on every merge to main using Github Actions. You can see the steps for running these in the file .github/workflows/e2e.yml.

The other E2E test suites are not currently (as of 12/14/22) being run in CI.

## Retrying flaky tests

The configuration for retrying tests is set in the wdio.conf.js file under the key specFileRetries

# Cucumber Directory Structure

```
├── src
│   ├── cucumber
│   │   ├── features
│   │   │   ├── lantern
│   │   │   │   ├── *.feature
│   │   │   ├── support
│   │   │   │   ├── hooks.js
│   │   │   ├── workflows
│   │   │   │   ├── *.feature
│   │   ├── pages
│   │   │   │   ├── *Page.js
│   │   ├── steps
│   │   │   │   ├── fixtures
│   │   │   │   ├── workflows
│   │   │   │   │   ├── *Steps.js
│   │   │   │   ├── *Steps.js
```

The directory is organized into **features, pages, and steps.** This organization promotes building [**the page-object pattern**](https://webdriver.io/docs/pageobjects/)as described in the WDIO docs.

Features are written in the Cucumber / Gherkin syntax. Each feature step must have a corresponding step defined in the steps files. Steps are organized by feature, and shared steps are kept in steps/workflows/sharedSteps.

# Best practices for writing a feature test

## Adding a new feature test

Steps to add a new feature test:

1.  Add a \*.feature file to the features/workflows directory
2.  Try to re-use existing steps as much as possible, or if adding new ones, try to make them generic enough to be re-usable by other features. Add the new steps in the `/steps` directory files.
3.  Add any new pages needed to access elements
4.  Add any class names to elements to make selecting easier
5.  Write assertions about what the user should see on the page

## Selectors

**Note: The WDIO selectors** **react$** **and** **react$$** **do not seem to be as reliable as using class names. Avoid using these selectors.**

**Links**

- [Link to selectors documentation from WDIO](https://webdriver.io/docs/selectors/)
- [Link to the $ selector doc](https://webdriver.io/docs/api/browser/$) - select 1 element
- [Link to the $$ selector doc](https://webdriver.io/docs/api/browser/$$) - select multiple elements

Example of selecting by text

```
await $(`div.CaseloadSelect__multi-value__label=${officerName}`);
```

## Waiting and Timing

Once you select an element on the page, you should also add a call to wait for the elements to exist before moving on to the next step. There are several ways to wait for elements:

**waitForExist() method on the element**

Use this if you are waiting for a single element

```
const selectedOption = await $(`div.CaseloadSelect__multi-value__label=${*officerName*}`);
await selectedOption.waitForExist();
```

**waitForElementsToExist helper**

Use this if you are waiting for multiple elements

```
const selectedOptions = await $$(".CaseloadSelect__multi-value__label");
await waitForElementsToExist(selectedOptions);
```

**browser.pause(seconds)**

Use this if you are waiting for something that is not a network request, for example, page animation.

```
await browser.pause(3000);
```

**waitForNavigation(navigationTriggeringAction)**

Use this to wait for pages to reload/refreshor navigating to a new page

```
const viewAllLink = await browser.$(`.ViewAllLink__${*opportunityType*}`);
await waitForNavigation(viewAllLink.click());
```

**waitForNetworkIdle()**

Use this to wait for network requests to end when fetching data

```
const option = await $(`div.CaseloadSelect__option=${*officerName*}`);
await option.waitForExist();

// Wait for data to load

await *Promise*.all([option.click(), waitForNetworkIdle()]);
```

## Feature-coupled step definitions

[Feature-coupled step definitions are step definitions that can't be resused, and may lead to an explosion of step definitions.](https://cucumber.io/docs/guides/anti-patterns/?lang=javascript) A best practice here would be to organize steps by domain concepts, i.e. steps that have to do with logging in, steps having to do with clicking buttons or links, etc. Try to write steps that can be reused across multiple feature tests.
