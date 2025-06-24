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

export const constructedOpportunityTypes = [
  // US_AR
  "usArInstitutionalWorkerStatus",

  // US_AZ
  "usAzOverdueForACISDTP",
  "usAzOverdueForACISTPR",
  "usAzReleaseToDTP",
  "usAzReleaseToTPR",

  // US_CA
  "usCaSupervisionLevelDowngrade",

  // US_IA
  "usIaEarlyDischarge",

  // US_ID
  "pastFTRD",
  "earnedDischarge",
  "LSU",
  "usIdExpandedCRC",
  "usIdCRCResidentWorker",
  "usIdCRCWorkRelease",
  "usIdSupervisionLevelDowngrade",
  "usIdCustodyLevelDowngrade",

  // US_ME
  "usMeSCCP",
  "usMeReclassificationReview",
  "usMeMediumTrustee",
  "usMeWorkRelease",
  "usMeEarlyTermination",
  "usMeFurloughRelease",

  // US_MI
  "usMiClassificationReview",
  "usMiEarlyDischarge",
  "usMiMinimumTelephoneReporting",
  "usMiPastFTRD",
  "usMiSupervisionLevelDowngrade",
  "usMiReclassificationRequest",
  "usMiSecurityClassificationCommitteeReview",
  "usMiWardenInPersonSecurityClassificationCommitteeReview",
  "usMiAddInPersonSecurityClassificationCommitteeReview",

  // US_MO
  "usMoOverdueRestrictiveHousingRelease",
  "usMoOverdueRestrictiveHousingInitialHearing",
  "usMoOverdueRestrictiveHousingReviewHearing",

  // US_NE
  "usNeConditionalLowRiskOverride",
  "usNeOverrideModerateToLow",

  // US_ND
  "earlyTermination",

  // US_OR
  "usOrEarnedDischargeSentence",

  // US_PA
  "usPaAdminSupervision",
  "usPaSpecialCircumstancesSupervision",

  // US_TN
  "compliantReporting",
  "usTnCompliantReporting2025Policy",
  "usTnCustodyLevelDowngrade",
  "usTnExpiration",
  "supervisionLevelDowngrade",
  "usTnAnnualReclassification",
  "usTnInitialClassification",
  "usTnSuspensionOfDirectSupervision",

  // US_TX
  "usTxAnnualReportStatus",
  "usTxEarlyReleaseFromSupervision",

  // US_UT
  "usUtEarlyTermination",
] as const;

export type OpportunityType = (typeof constructedOpportunityTypes)[number];
