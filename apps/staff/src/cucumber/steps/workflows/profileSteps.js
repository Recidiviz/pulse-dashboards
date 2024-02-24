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
import { Then } from "@cucumber/cucumber";

import { waitForElementsToExist } from "../utils";

/**
 * Then
 * */

Then("I should see the following details {string}", async (listOfDetails) => {
  const details = listOfDetails.split(", ");
  const profileDetailsComponent = await $(".ProfileDetails");
  await profileDetailsComponent.waitForExist();
  const detailsText = await profileDetailsComponent.getText();
  details.forEach((detail) => {
    expect(detailsText).toEqual(expect.stringContaining(detail));
  });
});

Then("I should see an accordion with {int} opportunities", async (numOpps) => {
  const accordionItems = await $$(".ProfileOpportunityItem");
  await waitForElementsToExist(accordionItems);
  expect(accordionItems.length).toEqual(numOpps);
});

Then(
  "I should see a sentence progress timeline show {string}",
  async (monthsLeft) => {
    const monthsLeftRegex = new RegExp(monthsLeft);
    const sentenceTimeline = await $(".SentenceProgress");
    await sentenceTimeline.waitForExist();
    const timelineText = await sentenceTimeline.getText();
    expect(timelineText).toEqual(expect.stringMatching(monthsLeftRegex));
  }
);
