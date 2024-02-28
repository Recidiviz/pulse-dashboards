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

import { waitForElementsToExist, waitForNetworkIdle } from "../utils";

/**
 * Given
 * */

Given("There are no officers pre-selected in the dropdown", async () => {
  const container = await $(".CaseloadSelect");
  const promptText = await container.getText();
  expect(promptText).toEqual(expect.stringContaining("Search for one or more"));
});

/**
 * When
 * */

When("I clear the officer {string}", async (officerName) => {
  const option = await $(
    `div.CaseloadSelect__multi-value__label=${officerName}`,
  );
  await option.waitForExist();
  const clearIcon = await option.$(function () {
    return this.nextSibling;
  });
  await clearIcon.waitForExist();
  await clearIcon.click();
});

When("I click on the Clear Officers link", async () => {
  const link = await $(
    `.CaseloadSelect__indicator.CaseloadSelect__clear-indicator`,
  );
  await link.click();
});

/**
 * Then
 * */
Then(
  "I should see the officer {string} selected in the search bar",
  async (officerName) => {
    await waitForNetworkIdle();
    const selectedOption = await $(
      `div.CaseloadSelect__multi-value__label=${officerName}`,
    );
    await selectedOption.waitForExist();
    const selectedOptionText = await selectedOption.getText();
    expect(selectedOptionText).toEqual(officerName);
  },
);

Then(
  "I should see a total of {int} officer(s) selected",
  async (numSelected) => {
    const selectedOptions = await $$(".CaseloadSelect__multi-value__label");
    await waitForElementsToExist(selectedOptions);
    expect(selectedOptions.length).toEqual(numSelected);
  },
);

Then("I should see no officers selected", async () => {
  const selectedOptions = await $$(".CaseloadSelect__multi-value__label");
  expect(selectedOptions.length).toEqual(0);
});
