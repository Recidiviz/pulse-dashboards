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

/** Formatter for opportunity headers */
export const oppHeaderCountFormatter = (quantity: number): string | number => {
  return quantity === 0 ? "Some" : quantity;
};

/** Auto refers to users who have a default snooze until set.
 * defaultSnoozeUntilFn is used to calculate the default snooze until,
 * e.g. weekly on Mondays or 90 days.
 * */
export type AutoSnoozeUntil = {
  defaultSnoozeUntilFn: (snoozedOn: Date, opportunity?: Opportunity) => Date;
  maxSnoozeDays?: never;
  defaultSnoozeDays?: never;
};

/** Manual refers to users who are able to set the number of days to snooze until.
 * maxSnoozeDays sets the max number of days on the slider.
 */
type ManualSnoozeUntil = {
  defaultSnoozeDays: number;
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
  firestoreCollection: string;
  snooze?: SnoozeConfig;
  customTabOrder?: OpportunityTab[];
  initialHeader?: string;
  hydratedHeader: (count: number) => OpportunityHydratedHeader;
};

export const US_CA_OPPORTUNITY_CONFIGS = {
  usCaSupervisionLevelDowngrade,
} as const;

export const US_ID_OPPORTUNITY_CONFIGS = {
  earnedDischarge,
  LSU,
  pastFTRD,
  usIdExpandedCRC,
  usIdCRCResidentWorker,
  usIdCRCWorkRelease,
  usIdSupervisionLevelDowngrade,
} as const;

export const US_ME_OPPORTUNITY_CONFIGS = {
  usMeEarlyTermination,
  usMeFurloughRelease,
  usMeSCCP,
  usMeWorkRelease,
} as const;

export const US_MI_OPPORTUNITY_CONFIGS = {
  usMiClassificationReview,
  usMiEarlyDischarge,
  usMiMinimumTelephoneReporting,
  usMiPastFTRD,
  usMiSupervisionLevelDowngrade,
} as const;

export const US_MO_OPPORTUNITY_CONFIGS = {
  usMoRestrictiveHousingStatusHearing,
} as const;

export const US_ND_OPPORTUNITY_CONFIGS = {
  earlyTermination,
} as const;

export const US_TN_OPPORTUNITY_CONFIGS = {
  compliantReporting,
  usTnCustodyLevelDowngrade,
  usTnExpiration,
  supervisionLevelDowngrade,
  usTnAnnualReclassification,
} as const;

export const OPPORTUNITY_CONFIGS_BY_STATE = {
  US_CA: US_CA_OPPORTUNITY_CONFIGS,
  US_ID: US_ID_OPPORTUNITY_CONFIGS,
  US_ME: US_ME_OPPORTUNITY_CONFIGS,
  US_MI: US_MI_OPPORTUNITY_CONFIGS,
  US_MO: US_MO_OPPORTUNITY_CONFIGS,
  US_ND: US_ND_OPPORTUNITY_CONFIGS,
  US_TN: US_TN_OPPORTUNITY_CONFIGS,
} as const;

export const OPPORTUNITY_CONFIGS = {
  ...US_CA_OPPORTUNITY_CONFIGS,
  ...US_ID_OPPORTUNITY_CONFIGS,
  ...US_ME_OPPORTUNITY_CONFIGS,
  ...US_MI_OPPORTUNITY_CONFIGS,
  ...US_MO_OPPORTUNITY_CONFIGS,
  ...US_ND_OPPORTUNITY_CONFIGS,
  ...US_TN_OPPORTUNITY_CONFIGS,
};

export type OpportunityConfigMap = typeof OPPORTUNITY_CONFIGS;

export type OpportunityType = keyof typeof OPPORTUNITY_CONFIGS;

export const getStateOpportunityTypes = (
  stateCode: keyof typeof OPPORTUNITY_CONFIGS_BY_STATE
): OpportunityType[] => {
  const stateConfigs: any = OPPORTUNITY_CONFIGS_BY_STATE[stateCode];
  return Object.keys(stateConfigs) as OpportunityType[];
};
