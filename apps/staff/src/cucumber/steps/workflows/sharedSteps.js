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

import {
  WorkflowsClientsPage,
  WorkflowsFormPage,
  WorkflowsHomepage,
  WorkflowsJIIProfilePage,
  WorkflowsOpportunityPage,
} from "../../pages";
import {
  switchUserStateCode,
  waitForNavigation,
  waitForNetworkIdle,
} from "../utils";

const pageMapping = {
  home: WorkflowsHomepage,
  clients: WorkflowsClientsPage,
  opportunity: WorkflowsOpportunityPage,
  profile: WorkflowsJIIProfilePage,
};

/**
 * Given
 * */
Given(
  "I am a {string} user on the {string} page",
  async (stateCode, pageName) => {
    WorkflowsHomepage.open();
    await switchUserStateCode(stateCode);
    if (pageMapping[pageName]) {
      await pageMapping[pageName].open();
    } else {
      await pageMapping.opportunity.open(pageName);
    }
  },
);

Given(
  "I am a {string} user on the profile page for person ID {string}",
  async (stateCode, personID) => {
    WorkflowsHomepage.open();
    await switchUserStateCode(stateCode);
    await pageMapping.profile.open(personID);
  },
);

/**
 * When
 * */
When("I select {string} from the dropdown", async (searchValue) => {
  await waitForNetworkIdle();
  const container = await $(".CaseloadSelect");
  await container.click();
  await waitForNetworkIdle();
  // Wait for options to load
  await browser.pause(2000);
  const option = await $(`div.CaseloadSelect__option=${searchValue}`);
  await option.waitForExist();
  // Wait for data to load
  await Promise.all([option.click(), waitForNetworkIdle()]);
  await browser.pause(1000);
});

When("I click on the {string} button", async (buttonClassName) => {
  const button = await $(`.${buttonClassName}`);
  await button.waitForExist();
  await waitForNavigation(button.click());
});

When("I click on the button with text {string}", async (buttonText) => {
  const button = await $(`button=${buttonText}`);
  await button.waitForExist();
  // Don't do waitForNavigation because not all button clicks result in a new URL being navigated to
  await button.click();
});

/**
 * Then
 * */
Then(
  "I should navigate to the {string} opportunity page",
  async (opportunityType) => {
    const url = await browser.getUrl();
    expect(url).toEqual(
      expect.stringContaining(`/workflows/${opportunityType}`),
    );
  },
);

Then(
  "I should navigate to the person profile page for person ID {string}",
  async (personID) => {
    const url = await browser.getUrl();
    expect(url).toEqual(
      expect.stringContaining(`/workflows/clients/${personID}`),
    );
  },
);

Then("I should navigate to the {string} form page", async (opportunityType) => {
  const url = await browser.getUrl();
  const pattern = new RegExp(`/workflows/${opportunityType}/[\\d\\D]+$`);
  expect(url).toEqual(expect.stringMatching(pattern));
});

Then(
  "I should see the criteria list with the text {string}",
  async (criteriaText) => {
    const criteriaList = await WorkflowsFormPage.criteriaList();
    expect(await criteriaList.getText()).toEqual(
      expect.stringContaining(criteriaText),
    );
  },
);

Then(
  "I should see the details section with the text {string}",
  async (detailsText) => {
    const detailsSection = await WorkflowsFormPage.detailsSection();
    expect(await detailsSection.getText()).toEqual(
      expect.stringContaining(detailsText),
    );
  },
);

Then(
  "I should see the button {string} to navigate to the form",
  async (buttonText) => {
    const navigateToFormButton =
      await WorkflowsOpportunityPage.navigateToFormButton();
    expect(await navigateToFormButton.getText()).toEqual(buttonText);
  },
);

Then(
  "I should see a preview of the opportunity for {string}",
  async (personName) => {
    const previewWrapper = await $(".WorkflowsPreviewModal");
    await previewWrapper.waitForExist();
    const text = await previewWrapper.getText();
    expect(text).toEqual(expect.stringContaining(personName));
  },
);
