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

import { OpportunityType } from "~datatypes";

import { Client } from "../Client";
import { Resident } from "../Resident";
import {
  CompliantReportingOpportunity,
  EarnedDischargeOpportunity,
  LSUOpportunity,
  Opportunity,
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
import { UsArInstitutionalWorkerStatusOpportunity } from "./UsAr/UsArInstitutionalWorkerStatusOpportunity/UsArInstitutionalWorkerStatusOpportunity";
import { UsAzOverdueForAcisDtpOpportunity } from "./UsAz/UsAzOverdueForAcisDtpOpportunity/UsAzOverdueForAcisDtpOpportunity";
import { UsAzOverdueForAcisTprOpportunity } from "./UsAz/UsAzOverdueForAcisTprOpportunity/UsAzOverdueForAcisTprOpportunity";
import { UsAzReleaseToDTPOpportunity } from "./UsAz/UsAzReleaseToDTPOpportunity/UsAzReleaseToDTPOpportunity";
import { UsAzReleaseToTPROpportunity } from "./UsAz/UsAzReleaseToTPROpportunity/UsAzReleaseToTPROpportunity";
import { UsIaEarlyDischargeOpportunity } from "./UsIa";
import { UsIdExpandedCRCOpportunity } from "./UsId";
import { UsIdCRCResidentWorkerOpportunity } from "./UsId/UsIdCRCResidentWorkerOpportunity/UsIdCRCResidentWorkerOpportunity";
import { UsIdCRCWorkReleaseOpportunity } from "./UsId/UsIdCRCWorkReleaseOpportunity";
import { UsIdCustodyLevelDowngradeOpportunity } from "./UsId/UsIdCustodyLevelDowngradeOpportunity";
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
import { UsNeSupervisionDowngradeOpportunity } from "./UsNe";
import { UsOrEarnedDischargeSentenceOpportunity } from "./UsOr/UsOrEarnedDischargeSentenceOpportunity";
import { UsPaAdminSupervisionOpportunity } from "./UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import {
  UsTnCustodyLevelDowngradeOpportunity,
  UsTnInitialClassificationOpportunity,
  UsTnSuspensionOfDirectSupervisionOpportunity,
} from "./UsTn";
import { UsTnAnnualReclassificationReviewOpportunity } from "./UsTn/UsTnAnnualReclassificationReviewOpportunity/UsTnAnnualReclassificationReviewOpportunity";
import { UsTnCompliantReporting2025PolicyOpportunity } from "./UsTn/UsTnCompliantReporting2025PolicyOpportunity";
import { UsTxAnnualReportStatusOpportunity } from "./UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunity";
import { UsTxEarlyReleaseFromSupervisionOpportunity } from "./UsTx/UsTxEarlyReleaseFromSupervisionOpportunity/UsTxEarlyReleaseFromSupervisionOpportunity";
import { UsUtEarlyTerminationOpportunity } from "./UsUt";

export const opportunityConstructors = {
  // US_AR
  usArInstitutionalWorkerStatus: UsArInstitutionalWorkerStatusOpportunity,

  // US_AZ
  usAzOverdueForACISDTP: UsAzOverdueForAcisDtpOpportunity,
  usAzOverdueForACISTPR: UsAzOverdueForAcisTprOpportunity,
  usAzReleaseToTPR: UsAzReleaseToTPROpportunity,
  usAzReleaseToDTP: UsAzReleaseToDTPOpportunity,

  // US_CA
  usCaSupervisionLevelDowngrade: UsCaSupervisionLevelDowngradeOpportunity,

  // US_IA
  usIaEarlyDischarge: UsIaEarlyDischargeOpportunity,

  // US_ID
  usIdCRCResidentWorker: UsIdCRCResidentWorkerOpportunity,
  usIdCRCWorkRelease: UsIdCRCWorkReleaseOpportunity,
  earnedDischarge: EarnedDischargeOpportunity,
  usIdExpandedCRC: UsIdExpandedCRCOpportunity,
  LSU: LSUOpportunity,
  pastFTRD: UsIdPastFTRDOpportunity,
  usIdSupervisionLevelDowngrade: UsIdSupervisionLevelDowngradeOpportunity,
  usIdCustodyLevelDowngrade: UsIdCustodyLevelDowngradeOpportunity,

  // US_MI
  usMiAddInPersonSecurityClassificationCommitteeReview:
    usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity,
  usMiClassificationReview: UsMiClassificationReviewOpportunity,
  usMiEarlyDischarge: UsMiEarlyDischargeOpportunity,
  usMiMinimumTelephoneReporting: UsMiMinimumTelephoneReportingOpportunity,
  usMiPastFTRD: UsMiPastFTRDOpportunity,
  usMiReclassificationRequest: usMiReclassificationRequestOpportunity,
  usMiSecurityClassificationCommitteeReview:
    usMiSecurityClassificationCommitteeReviewOpportunity,
  usMiSupervisionLevelDowngrade: UsMiSupervisionLevelDowngradeOpportunity,
  usMiWardenInPersonSecurityClassificationCommitteeReview:
    usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity,

  // US_ME
  usMeEarlyTermination: UsMeEarlyTerminationOpportunity,
  usMeFurloughRelease: UsMeFurloughReleaseOpportunity,
  usMeMediumTrustee: UsMeMediumTrusteeOpportunity,
  usMeReclassificationReview: UsMeAnnualReclassificationOpportunity,
  usMeSCCP: UsMeSCCPOpportunity,
  usMeWorkRelease: UsMeWorkReleaseOpportunity,

  // US_MO
  usMoOverdueRestrictiveHousingInitialHearing:
    UsMoOverdueRestrictiveHousingInitialHearingOpportunity,
  usMoOverdueRestrictiveHousingRelease:
    UsMoOverdueRestrictiveHousingReleaseOpportunity,
  usMoOverdueRestrictiveHousingReviewHearing:
    UsMoOverdueRestrictiveHousingReviewHearingOpportunity,

  // US_NE
  usNeConditionalLowRiskOverride: UsNeSupervisionDowngradeOpportunity,
  usNeOverrideModerateToLow: UsNeSupervisionDowngradeOpportunity,

  // US_ND
  earlyTermination: UsNdEarlyTerminationOpportunity,

  // US_OR
  usOrEarnedDischargeSentence: UsOrEarnedDischargeSentenceOpportunity,

  // US_PA
  usPaAdminSupervision: UsPaAdminSupervisionOpportunity,
  usPaSpecialCircumstancesSupervision:
    UsPaSpecialCircumstancesSupervisionOpportunity,

  // US_TN
  usTnAnnualReclassification: UsTnAnnualReclassificationReviewOpportunity,
  usTnInitialClassification: UsTnInitialClassificationOpportunity,
  compliantReporting: CompliantReportingOpportunity,
  usTnCompliantReporting2025Policy: UsTnCompliantReporting2025PolicyOpportunity,
  usTnExpiration: UsTnExpirationOpportunity,
  usTnCustodyLevelDowngrade: UsTnCustodyLevelDowngradeOpportunity,
  supervisionLevelDowngrade: UsTnSupervisionLevelDowngradeOpportunity,
  usTnSuspensionOfDirectSupervision:
    UsTnSuspensionOfDirectSupervisionOpportunity,

  // US_TX
  usTxAnnualReportStatus: UsTxAnnualReportStatusOpportunity,
  usTxEarlyReleaseFromSupervision: UsTxEarlyReleaseFromSupervisionOpportunity,

  // US_UT
  usUtEarlyTermination: UsUtEarlyTerminationOpportunity,
} as const satisfies Record<
  OpportunityType,
  | (new (
      resident: Resident,
      record: DocumentData,
      opportunityType: OpportunityType,
    ) => Opportunity<Resident>)
  | (new (
      client: Client,
      record: DocumentData,
      opportunityType: OpportunityType,
    ) => Opportunity<Client>)
>;
