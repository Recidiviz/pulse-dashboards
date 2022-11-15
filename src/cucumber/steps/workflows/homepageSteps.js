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

import workflowsHomepage from "../../pages/workflowsHomepage";
import users from "../fixtures/users";

Then(
  "I should see the homepage welcome message for the {string} user",
  async (stateCode) => {
    const promptElement = await workflowsHomepage.promptText();
    const promptText = await promptElement.getText();
    expect(promptText).toMatch(`Welcome, ${users[stateCode].name}`);
  }
);
