// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import fs from "fs";
import path from "path";

import workflowsFormPage from "../../pages/workflowsFormPage";
import {
  allowHeadlessDownloads,
  clickOutsideElement,
  respondWithOfflineUser,
  TEMP_DOWNLOAD_PATH,
  waitForFileToExist,
  waitForNetworkIdle,
} from "../utils";

/**
 * Given
 * */
Given(
  "I am a {string} user on the {string} form page for {string}",
  async (stateCode, opportunityType, pseudonymizedId) => {
    await respondWithOfflineUser(stateCode);
    await workflowsFormPage.open(opportunityType, pseudonymizedId);
  }
);

/**
 * When
 * */

When(
  "I click into the {string} form field and update the value to {string}",
  async (inputId, inputValue) => {
    const formField = await $(`input#${inputId}`);
    await formField.setValue(inputValue);
    const criteriaList = await workflowsFormPage.criteriaList();
    await criteriaList.click();
    // Wait for data to save to firestore
    await browser.pause(2000);
  }
);

When("I click on the export form button", async () => {
  const button = await workflowsFormPage.formActionButton();
  await button.waitForExist();
  await allowHeadlessDownloads();

  // Wait for file to download
  await Promise.all([button.click(), waitForNetworkIdle()]);
});

When("I click on the {string} dropdown", async (dropdownButtonText) => {
  const dropdownButton = await $(`button=${dropdownButtonText}`);
  await dropdownButton.waitForExist();
  await dropdownButton.click();
});

When("I click on the checkbox for {string}", async (checkboxValue) => {
  const eligibilityCheckbox = await $(`span.Checkbox__label*=${checkboxValue}`);
  await eligibilityCheckbox.scrollIntoView();
  await eligibilityCheckbox.waitForExist();
  await eligibilityCheckbox.click();
  await clickOutsideElement();
});

/**
 * Then
 * */
Then("I should see the text {string} on the form", async (formText) => {
  const formViewerContainer = await workflowsFormPage.formViewerContainer();
  expect(await formViewerContainer.getText()).toEqual(
    expect.stringContaining(formText)
  );
});

Then(
  "I should see the criteria list with the text {string}",
  async (criteriaText) => {
    const criteriaList = await workflowsFormPage.criteriaList();
    expect(await criteriaList.getText()).toEqual(
      expect.stringContaining(criteriaText)
    );
  }
);

Then(
  "I should see the details section with the text {string}",
  async (detailsText) => {
    const detailsSection = await workflowsFormPage.detailsSection();
    expect(await detailsSection.getText()).toEqual(
      expect.stringContaining(detailsText)
    );
  }
);

Then(
  "the value {string} should be saved in the form for the field {string}",
  async (inputValue, inputId) => {
    await browser.refresh();
    const formField = await $(`input#${inputId}`);
    await formField.waitForExist();
    // Wait for form text animation
    await browser.pause(3000);
    const formValue = await formField.getValue(inputValue);
    expect(formValue).toEqual(inputValue);
  }
);

Then(
  "I should see the export form button {string}",
  async (exportButtonText) => {
    const button = await workflowsFormPage.formActionButton();
    await button.waitForExist();
    expect(await button.getText()).toEqual(exportButtonText);
  }
);

Then("the form should export for filename {string}", async (filename) => {
  // we need to wait for the file to fully download
  // so we use the 'browser.call' function since this is an async operation
  // @see http://webdriver.io/api/utility/call.html
  const filepath = path.join(TEMP_DOWNLOAD_PATH, filename);
  await browser.call(async function () {
    await waitForFileToExist(filepath, 60000);
  });
  const fileContents = fs.readFileSync(filepath, "utf-8");
  expect(fileContents.length).toBeGreaterThan(0);
});

Then(
  "I should see the eligibility dropdown that has a reason listed like {string}",
  async (ineligibleReason) => {
    const dropdownContainer = await $(".OpportunityDenialDropdown");
    await dropdownContainer.waitForExist();
    const dropdownText = await dropdownContainer.getText();
    expect(dropdownText).toEqual(expect.stringContaining("Eligible"));
    expect(dropdownText).toEqual(expect.stringContaining(ineligibleReason));
  }
);

Then("I should see the value {string} selected", async (checkboxValue) => {
  const selectedDropdownButton = await $(`button=${checkboxValue}`);
  await selectedDropdownButton.waitForExist();
  const selectedText = await selectedDropdownButton.getText();
  expect(selectedText).toEqual(checkboxValue);
});

Then(
  "I should see the client labeled as {string}",
  async (eligibilityStatus) => {
    const eligibilityStatusEl = await $("span.EligibilityStatus");
    expect(await eligibilityStatusEl.getText()).toEqual(eligibilityStatus);
  }
);

Then("I should see the {string} dropdown", async (dropdownLabel) => {
  const dropdownButton = await $(`button=${dropdownLabel}`);
  await dropdownButton.waitForExist();
  expect(await dropdownButton.getText()).toEqual(dropdownLabel);
});
