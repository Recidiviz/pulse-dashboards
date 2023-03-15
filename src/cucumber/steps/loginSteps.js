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
import { Given, Then } from "@cucumber/cucumber";

import lanternPage from "../pages/lanternPage";
import loginPage from "../pages/loginPage";
import workflowsHomepage from "../pages/workflowsHomepage";
import { switchUserStateCode } from "./utils";

/**
 * Given
 * */
/* Login for Lantern */
Given("I am logged into Lantern as a {string} user", async (userLevel) => {
  const { username, password } = browser.config.credentials[userLevel];
  await loginPage.open();
  await loginPage.login(username, password);
});

/* Login for Workflows, Pathways */
Given("I am logged in as a {string} user", async function (stateCode) {
  workflowsHomepage.open();
  await switchUserStateCode(stateCode);
});

/**
 * Then
 * */
Then("I should see the Lantern landing page", async () => {
  const layout = await lanternPage.lanternLayout();
  expect(await layout.isExisting()).toEqual(true);
});
