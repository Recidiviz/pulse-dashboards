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

import { WorkflowsHomepage } from "../../pages";
import users from "../fixtures/users";
import { waitForElementsToExist, waitForNavigation } from "../utils";

/**
 * When
 * */
When("I click on View all for {string}", async (opportunityType) => {
  const viewAllLink = await browser.$(`.ViewAllLink__${opportunityType}`);
  await waitForNavigation(viewAllLink.click());
});

/**
 * Then
 * */
Then(
  "I should see the homepage welcome message for the {string} user",
  async (stateCode) => {
    const promptElement = await WorkflowsHomepage.promptText();
    const promptText = await promptElement.getText();
    expect(promptText).toMatch(`Welcome, ${users[stateCode].name}`);
  }
);

Then("I should see {int} opportunities listed", async (numOpportunities) => {
  const opportunities = await WorkflowsHomepage.opportunitySummaries();
  await waitForElementsToExist(opportunities);
  expect(opportunities.length).toEqual(numOpportunities);
});

Then("I should see {int} set of client avatars", async (numOpportunities) => {
  const avatarWrappers = await WorkflowsHomepage.clientAvatars();
  await waitForElementsToExist(avatarWrappers);
  expect(avatarWrappers.length).toEqual(numOpportunities);
});
