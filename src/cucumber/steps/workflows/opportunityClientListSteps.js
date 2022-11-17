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

import workflowsOpportunityPage from "../../pages/workflowsOpportunityPage";

/**
 * Given
 * */
Given(
  "I navigate to the {string} opportunity page",
  async (opportunityType) => {
    const opportunityLink = await $(`.BrandedNavLink__${opportunityType}`);
    await opportunityLink.click();
  }
);

/**
 * When
 * */
When("I hover over a client's name", async () => {
  const personName = await $(".PersonName");
  await personName.waitForExist();
  await personName.moveTo();
});

When("I click on the client {string}", async (personName) => {
  const personNameLink = await $(`.PersonName=${personName}`);
  await personNameLink.click();
  // Wait for Preview Modal to open
  await browser.pause(1000);
});

When("I exit the preview modal", async () => {
  const closeButton = await $(".OpportunityPreviewModal__close");
  await closeButton.waitForExist();
  await closeButton.click();
});

/**
 * Then
 * */
Then(
  "I should see the {string} heading and subheading",
  async (opportunityName) => {
    const heading = await workflowsOpportunityPage.pageHeading();
    const subheading = await workflowsOpportunityPage.pageSubheading();

    expect(await heading.getText()).toEqual(
      expect.stringContaining(opportunityName)
    );
    expect((await subheading.getText()).length).toBeGreaterThan(0);
  }
);

Then("I should see {int} clients listed", async (numClients) => {
  const clientList = await workflowsOpportunityPage.eligibleClientList();
  const clients = await clientList.$$("li");
  expect(clients.length).toEqual(numClients);
});

Then(
  "I should see the button {string} to navigate to the form",
  async (buttonText) => {
    const navigateToFormButton = await workflowsOpportunityPage.navigateToFormButton();
    expect(await navigateToFormButton.getText()).toEqual(buttonText);
  }
);

Then(
  "I should see a preview of the opportunity for {string}",
  async (clientName) => {
    const previewWrapper = await browser.react$(
      "OpportunityPreviewModal__Wrapper"
    );
    const text = await previewWrapper.getText();
    expect(text).toEqual(expect.stringContaining(clientName));
  }
);

Then("I should see the client status update", async () => {
  const status = await $(".WorkflowsStatus");
  await status.waitForExist();
  const text = await status.getText();
  const expectedStatus = new RegExp(
    "Viewed on \\d{1,2}/\\d{1,2}/\\d{1,2} by notarealemail@recidiviz.org"
  );
  expect(text).toEqual(expect.stringMatching(expectedStatus));
});
