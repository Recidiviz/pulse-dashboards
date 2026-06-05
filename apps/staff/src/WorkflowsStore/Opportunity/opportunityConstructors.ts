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
  UsMiCustodyLevelDowngradeOpportunity,
  UsMiEarlyDischargeOpportunity,
  UsMiMinimumTelephoneReportingOpportunity,
  UsMiPastFTRDOpportunity,
  UsMiSupervisionLevelDowngradeOpportunity,
  UsNdEarlyTerminationOpportunity,
  UsNdTransferToMinFacilityOpportunity,
  UsPaSpecialCircumstancesSupervisionOpportunity,
  UsTnBiAnnualOtherReclassificationV2Opportunity,
  UsTnExpirationOpportunity,
  UsTnSeriousMisconductUpgradeOpportunity,
  UsTnSeriousMisconductUpgradeV2Opportunity,
  UsTnSupervisionLevelDowngradeOpportunity,
  UsTnTrusteeTransferOpportunity,
  UsTnTrusteeTransferV2Opportunity,
} from ".";
import { UsArInstitutionalWorkerStatusOpportunity } from "./UsAr";
import {
  UsAzReleaseToDTPOpportunity,
  UsAzReleaseToTPROpportunity,
} from "./UsAz";
import { UsAzTransferToAdministrativeSupervisionOpportunity } from "./UsAz/UsAzTransferToAdministrativeSupervisionOpportunity/UsAzTransferToAdministrativeSupervisionOpportunity";
import {
  UsIaEarlyDischargeOpportunity,
  UsIaSupervisionLevelDowngradeOpportunity,
} from "./UsIa";
import {
  UsIdCustodyLevelDowngradeOpportunity,
  UsIdExpandedCRCOpportunity,
} from "./UsId";
import { UsIdCRCResidentWorkerOpportunity } from "./UsId/UsIdCRCResidentWorkerOpportunity";
import { UsIdCRCWorkReleaseOpportunity } from "./UsId/UsIdCRCWorkReleaseOpportunity";
import { UsIdOverdueFaceToFaceContactOpportunity } from "./UsId/usIdOverdueFaceToFaceContact";
import { UsIdTransferToCRCLikeBedOpportunity } from "./UsId/UsIdTransferToCRCLikeBedOpportunity";
import {
  UsMeFurloughReleaseOpportunity,
  UsMeSCCPOpportunity,
  UsMeWorkReleaseOpportunity,
} from "./UsMe";
import { UsMeAnnualReclassificationOpportunity } from "./UsMe/UsMeAnnualReclassificationOpportunity";
import { UsMeMediumTrusteeOpportunity } from "./UsMe/UsMeMediumTrusteeOpportunity";
import { usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity } from "./UsMi/UsMiAddInPersonSecurityClassificationCommitteeReviewOpportunity";
import { usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity } from "./UsMi/UsMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity";
import { usMiReclassificationRequestOpportunity } from "./UsMi/UsMiReclassificationRequestOpportunity";
import { usMiSecurityClassificationCommitteeReviewOpportunity } from "./UsMi/UsMiSecurityClassificationCommitteeReviewOpportunity";
import { usMiSecurityClassificationCommitteeReviewV2Opportunity } from "./UsMi/UsMiSecurityClassificationCommitteeReviewV2Opportunity";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity } from "./UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity";
import { usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity } from "./UsMi/UsMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity";
import { UsMoOverdueRestrictiveHousingInitialHearingOpportunity } from "./UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity";
import { UsMoOverdueRestrictiveHousingReleaseOpportunity } from "./UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity";
import { UsMoOverdueRestrictiveHousingReviewHearingOpportunity } from "./UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity";
import { UsMoWorkReleaseOpportunity } from "./UsMo/UsMoWorkReleaseOpportunity/UsMoWorkReleaseOpportunity";
import { UsNcCreditReductionReviewOpportunity } from "./UsNc/UsNcCreditReductionReviewOpportunity";
import {
  UsNeGoodTimeRestorationOpportunity,
  UsNeSupervisionDowngradeOpportunity,
} from "./UsNe";
import { UsOrEarnedDischargeSentenceOpportunity } from "./UsOr/UsOrEarnedDischargeSentenceOpportunity";
import { UsPaAdminSupervisionOpportunity } from "./UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionOpportunity";
import {
  UsTnCustodyLevelDowngradeOpportunity,
  UsTnInitialClassificationOpportunity,
  UsTnSuspensionOfDirectSupervisionOpportunity,
} from "./UsTn";
import {
  UsTnAnnualReclassification2026Opportunity,
  UsTnAnnualReclassificationReviewOpportunity,
  UsTnBiAnnualOtherReclassificationOpportunity,
  UsTnCompliantReporting2025PolicyOpportunity,
  UsTnCustodyLevelDowngrade2026Opportunity,
  UsTnCustodyLevelUpgrade2026Opportunity,
  UsTnInitialClassification2026Opportunity,
} from "./UsTn";
import {
  UsTnAnnualReclassification2026V2Opportunity,
  UsTnCustodyLevelDowngrade2026V2Opportunity,
  UsTnCustodyLevelUpgrade2026V2Opportunity,
} from "./UsTn/UsTn2026Classification/UsTnRCAFV2";
import { UsTxAnnualReportStatusOpportunity } from "./UsTx/UsTxAnnualReportStatusOpportunity/UsTxAnnualReportStatusOpportunity";
import { UsTxEarlyReleaseFromSupervisionOpportunity } from "./UsTx/UsTxEarlyReleaseFromSupervisionOpportunity/UsTxEarlyReleaseFromSupervisionOpportunity";
import { UsUtEarlyTerminationOpportunity } from "./UsUt";

export const opportunityConstructors = {
  // US_AR
  usArInstitutionalWorkerStatus: UsArInstitutionalWorkerStatusOpportunity,

  // US_AZ
  usAzTransferToAdministrativeSupervision:
    UsAzTransferToAdministrativeSupervisionOpportunity,
  usAzReleaseToTPR: UsAzReleaseToTPROpportunity,
  usAzReleaseToDTP: UsAzReleaseToDTPOpportunity,

  // US_CA
  usCaSupervisionLevelDowngrade: UsCaSupervisionLevelDowngradeOpportunity,

  // US_IA
  usIaEarlyDischarge: UsIaEarlyDischargeOpportunity,
  usIaCompleteSupervisionLevelDowngrade:
    UsIaSupervisionLevelDowngradeOpportunity,

  // US_ID
  usIdCRCResidentWorker: UsIdCRCResidentWorkerOpportunity,
  usIdCRCWorkRelease: UsIdCRCWorkReleaseOpportunity,
  earnedDischarge: EarnedDischargeOpportunity,
  usIdExpandedCRC: UsIdExpandedCRCOpportunity,
  LSU: LSUOpportunity,
  pastFTRD: UsIdPastFTRDOpportunity,
  usIdSupervisionLevelDowngrade: UsIdSupervisionLevelDowngradeOpportunity,
  usIdCustodyLevelDowngrade: UsIdCustodyLevelDowngradeOpportunity,
  usIdOverdueFaceToFaceContact: UsIdOverdueFaceToFaceContactOpportunity,
  usIdTransferToCRCLikeBed: UsIdTransferToCRCLikeBedOpportunity,

  // US_MI
  usMiAddInPersonSecurityClassificationCommitteeReview:
    usMiAddInPersonSecurityClassificationCommitteeReviewOpportunity,
  usMiAddInPersonSecurityClassificationCommitteeReviewV2:
    usMiAddInPersonSecurityClassificationCommitteeReviewV2Opportunity,
  usMiClassificationReview: UsMiClassificationReviewOpportunity,
  usMiEarlyDischarge: UsMiEarlyDischargeOpportunity,
  usMiMinimumTelephoneReporting: UsMiMinimumTelephoneReportingOpportunity,
  usMiPastFTRD: UsMiPastFTRDOpportunity,
  usMiReclassificationRequest: usMiReclassificationRequestOpportunity,
  usMiSecurityClassificationCommitteeReview:
    usMiSecurityClassificationCommitteeReviewOpportunity,
  usMiSecurityClassificationCommitteeReviewV2:
    usMiSecurityClassificationCommitteeReviewV2Opportunity,
  usMiSupervisionLevelDowngrade: UsMiSupervisionLevelDowngradeOpportunity,
  usMiWardenInPersonSecurityClassificationCommitteeReview:
    usMiWardenInPersonSecurityClassificationCommitteeReviewOpportunity,
  usMiWardenInPersonSecurityClassificationCommitteeReviewV2:
    usMiWardenInPersonSecurityClassificationCommitteeReviewV2Opportunity,
  usMiCustodyLevelDowngrade: UsMiCustodyLevelDowngradeOpportunity,

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
  usMoOutsideClearance: UsMoWorkReleaseOpportunity,
  usMoWorkRelease: UsMoWorkReleaseOpportunity,

  // US_NC
  usNcCreditReductionReview: UsNcCreditReductionReviewOpportunity,

  // US_ND
  earlyTermination: UsNdEarlyTerminationOpportunity,
  usNdTransferToMinFacility: UsNdTransferToMinFacilityOpportunity,

  // US_NE
  usNeConditionalLowRiskOverride: UsNeSupervisionDowngradeOpportunity,
  usNeOverrideModerateToLow: UsNeSupervisionDowngradeOpportunity,
  usNeGoodTimeRestoration: UsNeGoodTimeRestorationOpportunity,

  // US_OR
  usOrEarnedDischargeSentence: UsOrEarnedDischargeSentenceOpportunity,

  // US_PA
  usPaAdminSupervision: UsPaAdminSupervisionOpportunity,
  usPaSpecialCircumstancesSupervision:
    UsPaSpecialCircumstancesSupervisionOpportunity,

  // US_TN
  usTnAnnualReclassification: UsTnAnnualReclassificationReviewOpportunity,
  usTnAnnualReclassification2026Policy:
    UsTnAnnualReclassification2026Opportunity,
  usTnAnnualReclassification2026PolicyV2:
    UsTnAnnualReclassification2026V2Opportunity,
  usTnInitialClassification: UsTnInitialClassificationOpportunity,
  usTnInitialClassification2026Policy: UsTnInitialClassification2026Opportunity,
  compliantReporting: CompliantReportingOpportunity,
  usTnCompliantReporting2025Policy: UsTnCompliantReporting2025PolicyOpportunity,
  usTnExpiration: UsTnExpirationOpportunity,
  usTnCustodyLevelDowngrade: UsTnCustodyLevelDowngradeOpportunity,
  usTnCustodyLevelDowngrade2026Policy: UsTnCustodyLevelDowngrade2026Opportunity,
  usTnCustodyLevelDowngrade2026PolicyV2:
    UsTnCustodyLevelDowngrade2026V2Opportunity,
  usTnSpecialCustodyLevelUpgrade2026Policy:
    UsTnCustodyLevelUpgrade2026Opportunity,
  usTnSpecialCustodyLevelUpgrade2026PolicyV2:
    UsTnCustodyLevelUpgrade2026V2Opportunity,
  supervisionLevelDowngrade: UsTnSupervisionLevelDowngradeOpportunity,
  usTnSuspensionOfDirectSupervision:
    UsTnSuspensionOfDirectSupervisionOpportunity,
  usTnBiannualOther: UsTnBiAnnualOtherReclassificationOpportunity,
  usTnTrusteeTransfer: UsTnTrusteeTransferOpportunity,
  usTnSeriousMisconductUpgrade: UsTnSeriousMisconductUpgradeOpportunity,
  usTnBiannualOtherV2: UsTnBiAnnualOtherReclassificationV2Opportunity,
  usTnTrusteeTransferV2: UsTnTrusteeTransferV2Opportunity,
  usTnSeriousMisconductUpgradeV2: UsTnSeriousMisconductUpgradeV2Opportunity,

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
