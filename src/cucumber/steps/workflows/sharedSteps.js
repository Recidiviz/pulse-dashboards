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
  const container = await browser.react$("SelectContainer");
  await container.click();
  const option = await browser.react$("Option", {
    props: {
      value: officerId,
    },
  });
  option.click();
  // Wait for Loading spinner to appear and disappear
  const loadingSpinner = await $("div=Loading data...");
  await loadingSpinner.waitForExist();
  await loadingSpinner.waitForExist({ reverse: true });
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
