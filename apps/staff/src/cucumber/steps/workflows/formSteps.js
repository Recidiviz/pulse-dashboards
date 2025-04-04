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

import { Given, Then, When } from "@cucumber/cucumber";
import * as fs from "fs";
import * as fsPromise from "fs/promises";
import * as path from "path";

import { WorkflowsFormPage, WorkflowsHomepage } from "../../pages";
import {
  allowHeadlessDownloads,
  switchUserStateCode,
  waitForElementsToExist,
  waitForFileToExist,
  waitForNetworkIdle,
} from "../utils";

/**
 * Given
 * */
Given(
  "I am a {string} user on the {string} form page for {string}",
  async (stateCode, opportunityType, pseudonymizedId) => {
    await WorkflowsHomepage.open();
    await switchUserStateCode(stateCode);
    await WorkflowsFormPage.open(opportunityType, pseudonymizedId);
  },
);

/**
 * When
 * */

When(
  "I click into the {string} form field and update the value to {string}",
  async (inputId, inputValue) => {
    const formField = await $(`input#${inputId}`);
    // For some reason if you clear the web form inputs without focusing into them first, they put
    // their old value back when you set the value. Since this will probably never happen outside of
    // testing, just click in the test.
    await formField.click();
    await formField.setValue(inputValue);
    const criteriaList = await WorkflowsFormPage.criteriaList();
    await criteriaList.click();
    // Wait for data to save to firestore
    // eslint-disable-next-line wdio/no-pause
    await browser.pause(2500);
  },
);

When("I click on the export form button", async () => {
  const button = await WorkflowsFormPage.formActionButton();
  await button.waitForExist();
  // make sure download directory exists
  if (!fs.existsSync(global.downloadDir)) {
    // if it doesn't exist, create it
    fs.mkdirSync(global.downloadDir);
  }
  await allowHeadlessDownloads();

  // Wait for file to download
  await Promise.all([button.click(), waitForNetworkIdle()]);
});

When("I click on the button with the text {string}", async (buttonText) => {
  const button = await $(`button=${buttonText}`);
  await button.waitForExist();
  await button.scrollIntoView({
    block: "center",
    inline: "center",
  });
  await button.click();
  await waitForNetworkIdle();
});

When("I click on the checkbox for {string}", async (checkboxValue) => {
  const eligibilityCheckbox = await $(`span.Checkbox__label*=${checkboxValue}`);
  await eligibilityCheckbox.waitForExist();
  await eligibilityCheckbox.scrollIntoView({
    block: "center",
    inline: "center",
  });
  await eligibilityCheckbox.click();
  await waitForNetworkIdle();
});

When("I click on preview page {int}", async (pageNumber) => {
  const pages = await $$(".TEPESmallPagePreview");
  await waitForElementsToExist(pages);
  const page = pages[pageNumber - 1];
  await page.isExisting();
  await page.click();
  // eslint-disable-next-line wdio/no-pause
  await browser.pause(500);
});

/**
 * Then
 * */
Then("I should see the text {string} on the form", async (formText) => {
  const formViewerContainer = await WorkflowsFormPage.formViewerContainer();
  expect(await formViewerContainer.getText()).toEqual(
    expect.stringContaining(formText),
  );
});

Then(
  "the value {string} should be saved in the form for the field {string}",
  async (inputValue, inputId) => {
    await browser.refresh();
    const formField = await $(`input#${inputId}`);
    await formField.waitForExist();
    // Wait for form text animation
    // eslint-disable-next-line wdio/no-pause
    await browser.pause(3000);
    const formValue = await formField.getValue(inputValue);
    expect(formValue).toEqual(inputValue);
  },
);

Then(
  "I should see the export form button {string}",
  async (exportButtonText) => {
    const button = await WorkflowsFormPage.formActionButton();
    await button.waitForExist();
    expect(await button.getText()).toEqual(exportButtonText);
  },
);

Then("the form should export for filename {string}", async (filename) => {
  // we need to wait for the file to fully download
  // so we use the 'browser.call' function since this is an async operation
  // @see http://webdriver.io/api/utility/call.html
  const filepath = path.join(global.downloadDir, filename);
  await browser.call(async function () {
    await waitForFileToExist(filepath, 60000);
  });
  const fileHandle = await fsPromise.open(filepath);
  const fileContents = await fileHandle.readFile("utf-8");
  expect(fileContents.length).toBeGreaterThan(0);
});

Then(
  "I should see the update eligibility view that has a reason listed like {string}",
  async (ineligibleReason) => {
    const denialForm = await $(".OpportunityDenial");
    await denialForm.waitForExist();
    const menuItem = await $(`span.Checkbox__label*=${ineligibleReason}`);
    expect(await menuItem.getText()).toEqual(
      expect.stringContaining(ineligibleReason),
    );
  },
);

Then(
  "I should see the person labeled as {string}",
  async (eligibilityStatus) => {
    const eligibilityStatusEl = await $("span.EligibilityStatus");
    expect(await eligibilityStatusEl.getText()).toEqual(eligibilityStatus);
  },
);

Then("I should see the {string} dropdown", async (dropdownLabel) => {
  const dropdownButton = await $(`button=${dropdownLabel}`);
  await dropdownButton.waitForExist();
  expect(await dropdownButton.getText()).toEqual(dropdownLabel);
});

Then("the value {string} should appear in the form preview", async (value) => {
  const preview = await $(".formPreview");
  await preview.waitForExist();
  const text = await preview.getText();
  expect(text).toEqual(expect.stringContaining(value));
});

Then("the value {string} should appear in the preview modal", async (value) => {
  const preview = await $(".WriteToTOMISModal");
  await preview.waitForExist();
  const text = await preview.getText();
  expect(text).toEqual(expect.stringContaining(value));
});

Then("the value {string} should appear in the page preview", async (value) => {
  const preview = await $(".TEPEPagePreview");
  await preview.waitForExist();
  const text = await preview.getText();
  expect(text).toEqual(expect.stringContaining(value));
});

Then("there should be {int} pages of notes", async (numPages) => {
  const pages = await $$(".TEPESmallPagePreview");
  await waitForElementsToExist(pages);
  expect(pages.length).toEqual(numPages);
});
