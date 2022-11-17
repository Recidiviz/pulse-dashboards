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

/**
 * When
 * */
When("I select officer {string} from the dropdown", async (officerId) => {
  const container = await $(".CaseloadSelect");
  await container.click();
  const option = await browser.react$("Option", {
    props: {
      value: officerId,
    },
  });
  await option.waitForExist();
  await option.click();
  await browser.pause(500);
});

When("I click on the {string} button", async (buttonClassName) => {
  const button = await $(`.${buttonClassName}`);
  await button.click();
  await browser.pause(1000);
});

/**
 * Then
 * */
Then(
  "I should navigate to the {string} opportunity page",
  async (opportunityType) => {
    const url = await browser.getUrl();
    expect(url).toEqual(
      expect.stringContaining(`/workflows/${opportunityType}`)
    );
  }
);

Then("I should navigate to the {string} form page", async (opportunityType) => {
  const url = await browser.getUrl();
  const pattern = new RegExp(`/workflows/${opportunityType}/[\\d\\D]+$`);
  expect(url).toEqual(expect.stringMatching(pattern));
});
