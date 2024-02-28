// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { uniq } from "lodash";

import lanternPage from "../pages/lanternPage";

/**
 * Given
 * */
Given("I wait for {int} seconds", async (s) => {
  await new Promise((resolve) => setTimeout(resolve, s * 1000));
});

/**
 * When
 * */
When(
  "I select district {string} from the District Filter",
  async (districtId) => {
    const districtFilter = await lanternPage.districtFilter();
    const districtFilterMenu = await lanternPage.districtFilterMenu();
    await districtFilter.click();
    const el = await $(`.MultiSelect__checkbox-container=${districtId}`);
    await el.click();
    await (await districtFilter.parentElement()).click();
    await !districtFilterMenu.isExisting();
  },
);

When("I am viewing the Case Table", async () => {
  const caseTable = await lanternPage.caseTable();
  await caseTable.scrollIntoView();
  caseTable.waitUntil(function () {
    return this.isDisplayedInViewport();
  });
});

/**
 * Then
 * */
Then("I should only see cases from district {string}", async (districtIds) => {
  const caseTableDistrictColumns = await lanternPage.caseTableDistrictColumns();
  const columnValues = await Promise.all(
    caseTableDistrictColumns.map(async function (el) {
      return el.getText();
    }),
  );
  const expectedValues = districtIds.split(",").sort();
  expect(expectedValues).toEqual(expect.arrayContaining(uniq(columnValues)));
});

Then(
  "I should see {string} selected in the district filter",
  async (districtId) => {
    const districtFilter = await lanternPage.districtFilter();
    expect(await districtFilter.getText()).toMatch(districtId);
  },
);

Then("I should not be able to change the selected district", async () => {
  const disabledDistrictFilter = await lanternPage.disabledDistrictFilter();
  expect(await disabledDistrictFilter.isExisting()).toEqual(true);
});

Then(
  "I should see district {string} highlighted on the chart",
  async (districtIds) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const chartWrapper = await lanternPage.getDistrictChartWrapperByDistrictIds(
      districtIds.split(","),
    );
    expect(await chartWrapper.isExisting()).toEqual(true);
  },
);
