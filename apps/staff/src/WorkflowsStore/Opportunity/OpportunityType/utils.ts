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

import { DeepWriteable } from "./types";

/**
 * The states with their own OpportunityTypes. NOTE: This is not the same as all {@link TenantConfigId} states.
 */
export const OPPORTUNITY_TYPES_BY_STATE = {
  US_CA: ["usCaSupervisionLevelDowngrade"],
  US_ID: [
    "pastFTRD",
    "earnedDischarge",
    "LSU",
    "usIdExpandedCRC",
    "usIdCRCResidentWorker",
    "usIdCRCWorkRelease",
    "usIdSupervisionLevelDowngrade",
  ],
  US_ME: [
    "usMeSCCP",
    "usMeReclassificationReview",
    "usMeMediumTrustee",
    "usMeWorkRelease",
    "usMeEarlyTermination",
    "usMeFurloughRelease",
  ],
  US_MI: [
    "usMiClassificationReview",
    "usMiEarlyDischarge",
    "usMiMinimumTelephoneReporting",
    "usMiPastFTRD",
    "usMiSupervisionLevelDowngrade",
    "usMiReclassificationRequest",
    "usMiSecurityClassificationCommitteeReview",
    "usMiWardenInPersonSecurityClassificationCommitteeReview",
    "usMiAddInPersonSecurityClassificationCommitteeReview",
  ],
  US_MO: [
    "usMoRestrictiveHousingStatusHearing",
    "usMoOverdueRestrictiveHousingRelease",
    "usMoOverdueRestrictiveHousingInitialHearing",
    "usMoOverdueRestrictiveHousingReviewHearing",
  ],
  US_ND: ["earlyTermination"],
  US_OR: ["usOrEarnedDischarge"],
  US_PA: ["usPaAdminSupervision"],
  US_TN: [
    "compliantReporting",
    "usTnCustodyLevelDowngrade",
    "usTnExpiration",
    "supervisionLevelDowngrade",
    "usTnAnnualReclassification",
  ],
} as const;

/**
 *
 * @param stateCode The states with their own OpportunityTypes
 * @returns This returns the list of OpportunityTypes for a state.
 */
export function getStateOpportunityTypes<
  T extends keyof typeof OPPORTUNITY_TYPES_BY_STATE,
  // The type is narrowed to the `stateCode`'s OpportunityTypes.
>(stateCode: T): DeepWriteable<(typeof OPPORTUNITY_TYPES_BY_STATE)[T]> {
  return OPPORTUNITY_TYPES_BY_STATE[stateCode] as DeepWriteable<
    (typeof OPPORTUNITY_TYPES_BY_STATE)[T]
  >;
}
