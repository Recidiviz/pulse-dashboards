# Playwright E2E Testing Guide

These tests are run using [Playwright](https://playwright.dev/), and can be run from the command line, or using a plugin installed on your IDE.

## Running tests

These tests require the offline server to be running.

First install the Playwright tools
`npx install playwright`

To run the Playwright E2E tests from your command line:

1. Start the offline server `nx offline staff`
1. Run the tests: (headless) `nx e2e staff` or (headed) `nx e2e staff --headed`

To run the Playwright E2E tests from your IDE:

1. Start the offline server `nx offline staff`
1. Install the plugin for your IDE. Instructions for installing the plugin on VSCode are [here](https://playwright.dev/docs/getting-started-vscode).
1. Follow the instructions [here](https://playwright.dev/docs/getting-started-vscode) to run or debug tests.

## Writing tests

The easiest way to write new tests is using your the plugin for your IDE. Instructions for recording tests using the VSCode plugin are [here](https://playwright.dev/docs/getting-started-vscode#record-a-new-test).

Network responses can be mocked, which means that data displayed on the page can be adjusted and specified to test for specific features. This includes user information, permissions, and feature variants can be adjusted by mocking the "http://localhost:3001/api/offlineUser?\*" route.
