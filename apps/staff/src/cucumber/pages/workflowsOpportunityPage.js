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

/* eslint-disable class-methods-use-this */
import Page from "./basePage";

class WorkflowsOpportunityPage extends Page {
  async open(opportunityType) {
    await super.open(`${browser.config.baseUrl}/workflows/${opportunityType}`);
  }

  async pageHeading() {
    return $(".PersonList__Heading");
  }

  async pageSubheading() {
    return $(".PersonList__Subheading");
  }

  async navigateToFormButton() {
    return $("button.NavigateToFormButton");
  }
}

export default new WorkflowsOpportunityPage({ redirectPause: 3000 });
