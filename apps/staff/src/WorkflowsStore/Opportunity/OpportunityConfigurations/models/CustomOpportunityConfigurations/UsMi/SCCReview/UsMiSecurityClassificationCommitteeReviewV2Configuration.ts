// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { OpportunityTableColumnId } from "../../../../../../../core/OpportunityCaseloadView/HydratedOpportunityPersonList";
import { DenialInputSettings } from "../../../../../types";
import { ApiOpportunityConfiguration } from "../../../ApiOpportunityConfigurationImpl";

export class UsMiSecurityClassificationCommitteeReviewV2Configuration extends ApiOpportunityConfiguration {
  get enabledColumns(): Array<OpportunityTableColumnId> {
    const cols = [...super.enabledColumns];
    cols.push("US_MI_SEG_START_DATE");
    cols.push("US_MI_NEXT_SCC_DATE");
    cols.push("US_MI_LAST_SCC_DATE");
    cols.push("US_MI_SEG_DURATION");
    cols.push("US_MI_OPT");
    cols.push("US_MI_SMI");
    return cols.filter((c) => c !== "RELEASE_DATE");
  }

  get hydrateIneligibleRecordsInOpportunityManager() {
    return !!this.userStore.activeFeatureVariants
      .usMiRestrictiveHousingV2Ineligible;
  }

  get allSubcategoriesOfSubmitted() {
    return undefined;
  }

  get markSubmittedOnFormDownload() {
    return false;
  }

  get denialInputSettings(): Record<string, DenialInputSettings> {
    return {
      "START DATE INCORRECT": {
        required: true,
        inputType: "text",
        placeholder: "Please specify the start date you expected to see",
        heading: "Start Date:",
      },
    };
  }

  get sidebarComponents() {
    return [...super.sidebarComponents, "Programming"];
  }
}
