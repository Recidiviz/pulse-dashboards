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

import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

/**
 * For now, we use this single custom configuration for the three MI restrictive
 * housing V2 opportunities:
 * - UsMiSecurityClassificationCommitteeReviewV2
 * - UsMiWardenInPersonSecurityClassificationCommitteeReviewV2
 * - UsMiAddInPersonSecurityClassificationCommitteeReviewV2
 */
export class UsMiSecurityClassificationCommitteeReviewV2Configuration extends ApiOpportunityConfiguration {
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
}
