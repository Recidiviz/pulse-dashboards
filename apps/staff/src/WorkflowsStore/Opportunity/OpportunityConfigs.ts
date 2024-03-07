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
import { SystemId } from "../../core/models/types";
import { OpportunityProfileModuleName } from "../../core/WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import { FeatureVariant, TenantId } from "../../RootStore/types";
import { PartialRecord } from "../../utils/typeUtils";
import { Client } from "../Client";
import { Resident } from "../Resident";
import { OpportunityBase } from "./OpportunityBase";
import { DenialReasonsMap, Opportunity, OpportunityTab } from "./types";
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
import { usMoOverdueRestrictiveHousingInitialHearingConfig as usMoOverdueRestrictiveHousingInitialHearing } from "./UsMo/UsMoOverdueRestrictiveHousingInitialHearingOpportunity/config";
import { usMoOverdueRestrictiveHousingReleaseConfig as usMoOverdueRestrictiveHousingRelease } from "./UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity/config";
import { usMoOverdueRestrictiveHousingReviewHearingConfig as usMoOverdueRestrictiveHousingReviewHearing } from "./UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity/config";
import { usMoRestrictiveHousingStatusHearingConfig as usMoRestrictiveHousingStatusHearing } from "./UsMo/UsMoRestrictiveHousingStatusHearingOpportunity/config";
import { usNdEarlyTerminationConfig as earlyTermination } from "./UsNd/UsNdEarlyTerminationOpportunity/config";
import { usOrEarnedDischargeConfig as usOrEarnedDischarge } from "./UsOr/UsOrEarnedDischargeOpportunity/config";
import { usPaAdminSupervisionConfig as usPaAdminSupervision } from "./UsPa/UsPaAdminSupervisionOpportunity/config";
import { usTnCompliantReportingConfig as compliantReporting } from "./UsTn/CompliantReportingOpportunity/config";
import { UsTnAnnualReclassificationReviewConfig as usTnAnnualReclassification } from "./UsTn/UsTnAnnualReclassificationReviewOpportunity/config";
import { usTnCustodyLevelDowngradeConfig as usTnCustodyLevelDowngrade } from "./UsTn/UsTnCustodyLevelDowngradeOpportunity/config";
import { usTnExpirationConfig as usTnExpiration } from "./UsTn/UsTnExpirationOpportunity/config";
import { usTnSupervisionLevelDowngradeConfig as supervisionLevelDowngrade } from "./UsTn/UsTnSupervisionLevelDowngradeOpportunity/config";
import { CountFormatter } from "./utils/generateHeadersUtils";

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

type ExtractPersonType<T> =
  T extends OpportunityBase<infer P, any, any> ? P : never;

type ClientSystemType<T> = T extends Client
  ? Extract<SystemId, "SUPERVISION">
  : never;

type ResidentSystemType<T> = T extends Resident
  ? Extract<SystemId, "INCARCERATION">
  : never;

type SystemType<T> = ClientSystemType<T> | ResidentSystemType<T>;

export type OpportunityCountByFunction = (
  opportunities: Array<Opportunity>,
) => number;

export type OpportunityConfig<OpportunityVariant extends Opportunity> = {
  systemType: SystemType<ExtractPersonType<OpportunityVariant>>;
  stateCode: TenantId;
  urlSection: string;
  featureVariant?: FeatureVariant;
  inverseFeatureVariant?: FeatureVariant;
  label: string;
  firestoreCollection: string;
  snooze?: SnoozeConfig;
  tabOrder?: ReadonlyArray<OpportunityTab>;
  initialHeader?: string;
  hydratedHeader: (formattedCount: CountFormatter) => OpportunityHydratedHeader;
  denialButtonText?: string;
  eligibilityDateText?: string;
  hideDenialRevert?: boolean;
  countByFunction?: OpportunityCountByFunction;
  methodologyUrl: string;
  denialReasons: DenialReasonsMap;
  sidebarComponents: OpportunityProfileModuleName[];
  isAlert?: boolean;
  tooltipEligibilityText?: string;
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
  usMoOverdueRestrictiveHousingRelease,
  usMoOverdueRestrictiveHousingInitialHearing,
  usMoOverdueRestrictiveHousingReviewHearing,

  /* US_ND */
  earlyTermination,

  /* US_OR */
  usOrEarnedDischarge,

  /* US_PA */
  usPaAdminSupervision,

  /* US_TN */
  compliantReporting,
  usTnCustodyLevelDowngrade,
  usTnExpiration,
  supervisionLevelDowngrade,
  usTnAnnualReclassification,
};

export type OpportunityConfigMap = typeof OPPORTUNITY_CONFIGS;

/**
 * An {@link OpportunityType} represents the string and type representation of an {@link Opportunity}
 */
export type OpportunityType = keyof typeof OPPORTUNITY_CONFIGS;

/**
 * A {@link SupervisionOpportunityType} represents an opportunity
 * that could be available to someone who is currently a {@link Client} under supervision.
 *
 * @see {@link SUPERVISION_OPPORTUNITY_TYPES} for a list of their related configurations.
 */
export type SupervisionOpportunityType = {
  [key in keyof typeof OPPORTUNITY_CONFIGS]: (typeof OPPORTUNITY_CONFIGS)[key] extends OpportunityConfig<
    infer T
  >
    ? T extends OpportunityBase<Client, any, any>
      ? key
      : never
    : never;
}[keyof typeof OPPORTUNITY_CONFIGS];

/**
 * An {@link IncarcerationOpportunityType} represents an opportunity
 * that could be available to someone who is currently a {@link Resident} of
 * a facility Location.
 *
 * @see {@link INCARCERATION_OPPORTUNITY_TYPES} for a list of their related configurations.
 */
export type IncarcerationOpportunityType = {
  [key in keyof typeof OPPORTUNITY_CONFIGS]: (typeof OPPORTUNITY_CONFIGS)[key] extends OpportunityConfig<
    infer T
  >
    ? T extends OpportunityBase<Resident, any, any>
      ? key
      : never
    : never;
}[keyof typeof OPPORTUNITY_CONFIGS];

const getOpportunityTypesBySystemType = <T extends OpportunityType>(
  type: (typeof OPPORTUNITY_CONFIGS)[T]["systemType"],
) => {
  return Object.keys(OPPORTUNITY_CONFIGS).filter(
    (oppType) =>
      OPPORTUNITY_CONFIGS[oppType as OpportunityType].systemType === type,
  ) as T[];
};

export const SUPERVISION_OPPORTUNITY_TYPES =
  getOpportunityTypesBySystemType<SupervisionOpportunityType>("SUPERVISION");

export const INCARCERATION_OPPORTUNITY_TYPES =
  getOpportunityTypesBySystemType<IncarcerationOpportunityType>(
    "INCARCERATION",
  );

type ConfigsByStateMapping = PartialRecord<
  TenantId,
  Record<OpportunityType, OpportunityConfig<Opportunity>>
>;

export const OPPORTUNITY_CONFIGS_BY_STATE: ConfigsByStateMapping =
  Object.entries(OPPORTUNITY_CONFIGS).reduce(
    (acc: Partial<ConfigsByStateMapping>, [oppType, config]) => ({
      ...acc,
      [config.stateCode]: {
        ...acc[config.stateCode as TenantId],
        [oppType]: config,
      },
    }),
    {},
  ) as ConfigsByStateMapping;

type OppTypeForUrlByStateMapping = Record<
  TenantId,
  Record<OpportunityConfig<Opportunity>["urlSection"], OpportunityType>
>;

export const OPPORTUNITY_TYPE_FOR_URL_BY_STATE: Record<
  TenantId,
  Record<string, OpportunityType>
> = Object.entries(OPPORTUNITY_CONFIGS).reduce(
  (acc: Partial<OppTypeForUrlByStateMapping>, [oppType, config]) => ({
    ...acc,
    [config.stateCode]: {
      ...acc[config.stateCode as TenantId],
      [config.urlSection]: oppType,
    },
  }),
  {},
) as OppTypeForUrlByStateMapping;

export function isOpportunityTypeUrlForState(
  stateCode: TenantId,
  s: string,
): boolean {
  return s in (OPPORTUNITY_TYPE_FOR_URL_BY_STATE[stateCode] ?? {});
}

export const getStateOpportunityTypes = (
  stateCode: keyof typeof OPPORTUNITY_CONFIGS_BY_STATE,
): OpportunityType[] => {
  const stateConfigs = OPPORTUNITY_CONFIGS_BY_STATE[stateCode];
  return stateConfigs ? (Object.keys(stateConfigs) as OpportunityType[]) : [];
};
