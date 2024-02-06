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
/* eslint-disable class-methods-use-this */
import { OPPORTUNITY_CONFIGS } from "../../WorkflowsStore/Opportunity/OpportunityConfigs";
import Page from "./basePage";

class WorkflowsFormPage extends Page {
  async open(opportunityType, pseudonymizedId) {
    const pageName = OPPORTUNITY_CONFIGS[opportunityType].urlSection;
    await super.open(
      `${browser.config.baseUrl}/workflows/${pageName}/${pseudonymizedId}`
    );
  }

  async formViewerContainer() {
    return $(".WorkflowsFormContainer");
  }

  async criteriaList() {
    return $(".CriteraList");
  }

  async detailsSection() {
    return $(".DetailsSection");
  }

  async formActionButton() {
    return $(".WorkflowsFormDownloadButton");
  }
}

export default new WorkflowsFormPage({ redirectPause: 3000 });
