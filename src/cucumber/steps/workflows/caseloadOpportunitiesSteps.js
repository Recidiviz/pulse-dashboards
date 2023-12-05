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
import { Then, When } from "@cucumber/cucumber";

import { WorkflowsOpportunityPage } from "../../pages";
import {
  waitForElementsToExist,
  waitForNavigation,
  waitForNetworkIdle,
} from "../utils";

/**
 * When
 * */
When("I hover over a person's name", async () => {
  const personName = await $(".PersonName");
  await personName.waitForExist();
  await personName.moveTo();
});

When("I click on the person {string}", async (personName) => {
  const personNameLink = await $(`.PersonName=${personName}`);
  await personNameLink.waitForExist();
  await personNameLink.click();
  // Wait for Preview Modal to open
  await browser.pause(1000);
});

When("I exit the preview modal", async () => {
  const closeButton = await $(".WorkflowsPreviewModal__close");
  await closeButton.waitForExist();
  await closeButton.click();
});

When("I click on the View all link for {string}", async (opportunityType) => {
  const viewAllLink = await $(`.ViewAllLink__${opportunityType}`);
  await viewAllLink.waitForExist();
  await waitForNavigation(viewAllLink.click());
});

/**
 * Then
 * */
Then(
  "I should see the {string} heading and subheading",
  async (opportunityName) => {
    await waitForNetworkIdle();
    const headingEl = await WorkflowsOpportunityPage.pageHeading();
    const subheadingEl = await WorkflowsOpportunityPage.pageSubheading();

    await waitForElementsToExist([headingEl, subheadingEl]);

    const heading = await headingEl.getText();
    const subheading = await subheadingEl.getText();

    expect(heading).toEqual(expect.stringContaining(opportunityName));
    expect(subheading.length).toBeGreaterThan(0);
  }
);

Then("I should see {int} people listed", async (numPeople) => {
  await waitForNetworkIdle();
  const items = await $$(".PersonListItem__Link");
  await waitForElementsToExist(items);
  expect(items.length).toEqual(numPeople);
});

Then("I should see {int} tabs listed", async (numTabs) => {
  await waitForNetworkIdle();
  const items = await $$(".WorkflowsTabbedPersonList__tab");
  await waitForElementsToExist(items);
  expect(items.length).toEqual(numTabs);
});

Then(
  "I should see the status update for the person with external id {string}",
  async (externalId) => {
    const status = await $(`.WorkflowsStatus__${externalId}`);
    await status.waitForExist();
    const text = await status.getText();
    const expectedStatus =
      /Viewed on \d{1,2}\/\d{1,2}\/\d{1,2} by notarealemail@recidiviz.org/;

    expect(text).toEqual(expect.stringMatching(expectedStatus));
  }
);
