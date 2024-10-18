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

import { DocumentData } from "firebase/firestore";

import { Client } from "../Client";
import { Resident } from "../Resident";
import {
  CompliantReportingOpportunity,
  EarnedDischargeOpportunity,
  LSUOpportunity,
  Opportunity,
  OpportunityType,
  UsCaSupervisionLevelDowngradeOpportunity,
  UsIdPastFTRDOpportunity,
  UsIdSupervisionLevelDowngradeOpportunity,
  UsMeEarlyTerminationOpportunity,
  UsMiClassificationReviewOpportunity,
  UsMiEarlyDischargeOpportunity,
  UsMiMinimumTelephoneReportingOpportunity,
  UsMiPastFTRDOpportunity,
  UsMiSupervisionLevelDowngradeOpportunity,
  UsNdEarlyTerminationOpportunity,
  UsPaSpecialCircumstancesSupervisionOpportunity,
  UsTnExpirationOpportunity,
  UsTnSupervisionLevelDowngradeOpportunity,
} from ".";
import { UsIdExpandedCRCOpportunity } from "./UsId";
import { UsIdCRCResidentWorkerOpportunity } from "./UsId/UsIdCRCResidentWorkerOpportunity/UsIdCRCResidentWorkerOpportunity";
import { UsIdCRCWorkReleaseOpportunity } from "./UsId/UsIdCRCWorkReleaseOpportunity";
import {
  UsMeFurloughReleaseOpportunity,
  UsMeSCCPOpportunity,
  UsMeWorkReleaseOpportunity,
} from "./UsMe";
import { UsMeAnnualReclassificationOpportunity } from "./UsMe/UsMeAnnualReclassificationOpportunity";
import { UsMeMediumTrusteeOpportunity } from "./UsMe/UsMeMediumTrusteeOpportunity";
import { usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity } from "./UsMi/UsMiAddInPersonSecurityClassificationCommitteeReviewOpportunity";
import { usMiReclassificationRequestOpportunity } from "./UsMi/UsMiReclassificationRequestOpportunity";
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "./UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity } from "./UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity";
import { UsMoOverdueRestrictiveHousingInitialHearingOpportunity } from "./UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity";
import { UsMoOverdueRestrictiveHousingReleaseOpportunity } from "./UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity";
import { UsMoOverdueRestrictiveHousingReviewHearingOpportunity } from "./UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity";
import { UsOrEarnedDischargeOpportunity } from "./UsOr";
import { UsPaAdminSupervisionOpportunity } from "./UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import { UsTnCustodyLevelDowngradeOpportunity } from "./UsTn";
import { UsTnAnnualReclassificationReviewOpportunity } from "./UsTn/UsTnAnnualReclassificationReviewOpportunity/UsTnAnnualReclassificationReviewOpportunity";

export const opportunityConstructors = {
  compliantReporting: CompliantReportingOpportunity,
  earlyTermination: UsNdEarlyTerminationOpportunity,
  earnedDischarge: EarnedDischargeOpportunity,
  LSU: LSUOpportunity,
  pastFTRD: UsIdPastFTRDOpportunity,
  supervisionLevelDowngrade: UsTnSupervisionLevelDowngradeOpportunity,
  usIdSupervisionLevelDowngrade: UsIdSupervisionLevelDowngradeOpportunity,
  usMiSupervisionLevelDowngrade: UsMiSupervisionLevelDowngradeOpportunity,
  usMiClassificationReview: UsMiClassificationReviewOpportunity,
  usMiEarlyDischarge: UsMiEarlyDischargeOpportunity,
  usTnExpiration: UsTnExpirationOpportunity,
  usMeEarlyTermination: UsMeEarlyTerminationOpportunity,
  usMiMinimumTelephoneReporting: UsMiMinimumTelephoneReportingOpportunity,
  usMiPastFTRD: UsMiPastFTRDOpportunity,
  usCaSupervisionLevelDowngrade: UsCaSupervisionLevelDowngradeOpportunity,
  usOrEarnedDischarge: UsOrEarnedDischargeOpportunity,
  usPaAdminSupervision: UsPaAdminSupervisionOpportunity,
  usPaSpecialCircumstancesSupervision:
    UsPaSpecialCircumstancesSupervisionOpportunity,

  usIdCRCResidentWorker: UsIdCRCResidentWorkerOpportunity,
  usIdCRCWorkRelease: UsIdCRCWorkReleaseOpportunity,
  usIdExpandedCRC: UsIdExpandedCRCOpportunity,
  usMeFurloughRelease: UsMeFurloughReleaseOpportunity,
  usMeMediumTrustee: UsMeMediumTrusteeOpportunity,
  usMeSCCP: UsMeSCCPOpportunity,
  usMeWorkRelease: UsMeWorkReleaseOpportunity,
  usTnCustodyLevelDowngrade: UsTnCustodyLevelDowngradeOpportunity,
  usTnAnnualReclassification: UsTnAnnualReclassificationReviewOpportunity,
  usMoOverdueRestrictiveHousingRelease:
    UsMoOverdueRestrictiveHousingReleaseOpportunity,
  usMoOverdueRestrictiveHousingInitialHearing:
    UsMoOverdueRestrictiveHousingInitialHearingOpportunity,
  usMoOverdueRestrictiveHousingReviewHearing:
    UsMoOverdueRestrictiveHousingReviewHearingOpportunity,
  usMeReclassificationReview: UsMeAnnualReclassificationOpportunity,
  usMiReclassificationRequest: usMiReclassificationRequestOpportunity,
  usMiSecurityClassificationCommitteeReview:
    usMiSecurityClassificationCommitteeReviewOpportunity,
  usMiWardenInPersonSecurityClassificationCommitteeReview:
    usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity,
  usMiAddInPersonSecurityClassificationCommitteeReview:
    usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity,
} as const satisfies Record<
  OpportunityType,
  | (new (c: Resident, r: DocumentData) => Opportunity<Resident>)
  | (new (c: Client, r: DocumentData) => Opportunity<Client>)
>;
