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

import lanternPage from "../pages/lanternPage";

/**
 * Given
 * */
Given("I am viewing the District chart", async () => {
  const chart = await lanternPage.districtChartCanvas();
  expect(await chart.isExisting()).toEqual(true);
});

/**
 * When
 * */
When("I click on the {string} revocations link", async (linkText) => {
  const link = await lanternPage.getRevocationsLink(linkText);
  await link.click();
});

/**
 * Then
 * */
Then("I should see the Officer chart", async () => {
  const chart = await lanternPage.officerChartCanvas();
  await chart.waitForExist();
  expect(await chart.isExisting()).toEqual(true);
});

Then("I should see the Risk level chart", async () => {
  const chart = await lanternPage.riskLevelChartCanvas();
  await chart.waitForExist();
  expect(await chart.isExisting()).toEqual(true);
});
