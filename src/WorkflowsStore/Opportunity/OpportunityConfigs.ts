// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { FeatureVariant, TenantId } from "../../RootStore/types";
import { Opportunity, OpportunityTab } from "./types";
import { usCaSupervisionLevelDowngradeConfig as usCaSupervisionLevelDowngrade } from "./UsCa/UsCaSupervisionLevelDowngradeOpportunity/config";
import { usIdEarnedDischargeConfig as earnedDischarge } from "./UsId/EarnedDischargeOpportunity/config";
import { usIdLSUConfig as LSU } from "./UsId/LSUOpportunity/config";
import { usIdCRCResidentWorkerConfig as usIdCRCResidentWorker } from "./UsId/UsIdCRCResidentWorkerOpportunity/config";
import { usIdCRCWorkReleaseConfig as usIdCRCWorkRelease } from "./UsId/UsIdCRCWorkReleaseOpportunity/config";
import { usIdExpandedCRCConfig as usIdExpandedCRC } from "./UsId/UsIdExpandedCRCOpportunity/config";
import { usIdPastFTRDConfig as pastFTRD } from "./UsId/UsIdPastFTRDOpportunity/config";
import { usIdSupervisionLevelDowngradeConfig as usIdSupervisionLevelDowngrade } from "./UsId/UsIdSupervisionLevelDowngradeOpportunity/config";
import { usMeEarlyTerminationConfig as usMeEarlyTermination } from "./UsMe/UsMeEarlyTerminationOpportunity/config";
import { usMeFurloughReleaseConfig as usMeFurloughRelease } from "./UsMe/UsMeFurloughReleaseOpportunity/config";
import { usMeSCCPConfig as usMeSCCP } from "./UsMe/UsMeSCCPOpportunity/config";
import { usMeWorkReleaseConfig as usMeWorkRelease } from "./UsMe/UsMeWorkReleaseOpportunity/config";
import { usMiClassificationReviewConfig as usMiClassificationReview } from "./UsMi/UsMiClassificationReviewOpportunity/config";
import { usMiEarlyDischargeConfig as usMiEarlyDischarge } from "./UsMi/UsMiEarlyDischargeOpportunity/config";
import { usMiMinimumTelephoneReportingConfig as usMiMinimumTelephoneReporting } from "./UsMi/UsMiMinimumTelephoneReportingOpportunity/config";
import { usMiPastFTRDConfig as usMiPastFTRD } from "./UsMi/UsMiPastFTRDOpportunity/config";
import { usMiSupervisionLevelDowngradeConfig as usMiSupervisionLevelDowngrade } from "./UsMi/UsMiSupervisionLevelDowngradeOpportunity/config";
import { usMoRestrictiveHousingStatusHearingConfig as usMoRestrictiveHousingStatusHearing } from "./UsMo/UsMoRestrictiveHousingStatusHearingOpportunity/config";
import { usNdEarlyTerminationConfig as earlyTermination } from "./UsNd/UsNdEarlyTerminationOpportunity/config";
import { usTnCompliantReportingConfig as compliantReporting } from "./UsTn/CompliantReportingOpportunity/config";
import { UsTnAnnualReclassificationReviewConfig as usTnAnnualReclassification } from "./UsTn/UsTnAnnualReclassificationReviewOpportunity/config";
import { usTnCustodyLevelDowngradeConfig as usTnCustodyLevelDowngrade } from "./UsTn/UsTnCustodyLevelDowngradeOpportunity/config";
import { usTnExpirationConfig as usTnExpiration } from "./UsTn/UsTnExpirationOpportunity/config";
import { usTnSupervisionLevelDowngradeConfig as supervisionLevelDowngrade } from "./UsTn/UsTnSupervisionLevelDowngradeOpportunity/config";

/** Auto refers to users who have a default snooze until set.
 * defaultSnoozeUntilFn is used to calculate the default snooze until,
 * e.g. weekly on Mondays or 90 days.
 * */
export type AutoSnoozeUntil = {
  defaultSnoozeUntilFn: (snoozedOn: Date, opportunity?: Opportunity) => Date;
  maxSnoozeDays?: never;
};

/** Manual refers to users who are able to set the number of days to snooze until.
 * maxSnoozeDays sets the max number of days on the slider.
 */
type ManualSnoozeUntil = {
  maxSnoozeDays: number;
  defaultSnoozeUntilFn?: never;
};

/* An opportunity will either have auto or manual set, but not both */
type SnoozeConfig = AutoSnoozeUntil | ManualSnoozeUntil;

export type OpportunityHeadersBaseType = {
  opportunityText: string;
  callToAction: string;
};

type OpportunityHeadersWithEligibilityTextType = OpportunityHeadersBaseType & {
  eligibilityText: string;
  fullText?: never;
};

type OpportunityHeadersWithFullTextType = OpportunityHeadersBaseType & {
  fullText: string;
  eligibilityText?: never;
};

export type OpportunityHydratedHeader =
  | OpportunityHeadersWithEligibilityTextType
  | OpportunityHeadersWithFullTextType;

export type OpportunityConfig = {
  stateCode: TenantId;
  urlSection: string;
  featureVariant?: FeatureVariant;
  label: string;
  snooze?: SnoozeConfig;
  customTabOrder?: OpportunityTab[];
  initialHeader?: string;
  hydratedHeader: (count: number) => OpportunityHydratedHeader;
};

export const OPPORTUNITY_CONFIGS = {
  /* US_CA */
  usCaSupervisionLevelDowngrade,

  /* US_ID */
  earnedDischarge,
  LSU,
  pastFTRD,
  usIdExpandedCRC,
  usIdCRCResidentWorker,
  usIdCRCWorkRelease,
  usIdSupervisionLevelDowngrade,

  /* US_ME */
  usMeEarlyTermination,
  usMeFurloughRelease,
  usMeSCCP,
  usMeWorkRelease,

  /* US_MI */
  usMiClassificationReview,
  usMiEarlyDischarge,
  usMiMinimumTelephoneReporting,
  usMiPastFTRD,
  usMiSupervisionLevelDowngrade,

  /* US_MO */
  usMoRestrictiveHousingStatusHearing,

  /* US_ND */
  earlyTermination,

  /* US_TN */
  compliantReporting,
  usTnCustodyLevelDowngrade,
  usTnExpiration,
  supervisionLevelDowngrade,
  usTnAnnualReclassification,
};

export type OpportunityConfigMap = typeof OPPORTUNITY_CONFIGS;

export type OpportunityType = keyof typeof OPPORTUNITY_CONFIGS;
