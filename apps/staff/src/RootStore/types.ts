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

/* eslint camelcase: 0 */
import { isDemoMode } from "~client-env-utils";

import { CSG, RECIDIVIZ_TENANT } from "../tenants";
import { PartialRecord } from "../utils/typeUtils";
import { DASHBOARD_TENANTS } from "./TenantStore/dashboardTenants";
import * as lantern from "./TenantStore/lanternTenants";
import * as pathways from "./TenantStore/pathwaysTenants";

export type LanternTenants = (typeof lantern.LANTERN_TENANTS)[number];
export type PathwaysTenants = (typeof pathways.PATHWAYS_TENANTS)[number];

export function isPathwaysTenantId(
  tenantId: TenantId | undefined,
): tenantId is PathwaysTenants {
  return pathways.PATHWAYS_TENANTS.includes(tenantId as PathwaysTenants);
}

export function isTenantId(tenantId: string): tenantId is TenantId {
  return TenantIds.includes(tenantId as TenantId);
}

export const TenantIds = DASHBOARD_TENANTS;

export type InternalTenantId = typeof RECIDIVIZ_TENANT | typeof CSG;
export type TenantId = (typeof TenantIds)[number];
export type TenantConfigId = InternalTenantId | TenantId;

export type UserAppMetadata = {
  stateCode: Lowercase<TenantConfigId>;
  allowedStates?: TenantId[];
  allowedSupervisionLocationIds?: string[];
  allowedSupervisionLocationLevel?: string;
  routes?: Record<string, boolean>;
  featureVariants?: FeatureVariantRecord;
  demoModeFeatureVariants?: FeatureVariantRecord;
  userHash?: string;
  pseudonymizedId?: string;
  segmentId?: string;
  intercomId?: string;
  district?: string;
  externalId?: string;
  firstName?: string;
  lastName?: string;
};

// TEST is useful for testing, as the name suggests,
// but also so that we don't have an empty union when there are no feature variants in use
export type FeatureVariant =
  | "TEST"
  // WORKFLOWS

  //// General
  | "caseNoteSearch"
  | "clientsResidentsTableViewToggle"
  | "formRevertButton"
  | "hideDenialRevert"
  | "hideWorkflowsOpportunities"
  | "hideWorkflowsResidentsPage"
  | "indefiniteSnooze"
  | "supervisionUnrestrictedSearch"
  | "taskSnoozeReason"
  | "tasksOneRowPerClient"
  | "tasksPermasnooze"
  | "tasksRoutePlanner"
  | "workflowsSupervisorSearch"
  | "sentenceProgressV2"
  | "useRecordForIneligibleOpps"

  //// Arizona
  | "usAzAdminSupervisionApprovalFlow"

  //// California
  | "usCaEnableSMS"

  //// Iowa
  | "usIaEarlyDischargeCustomizations"
  | "usIaEarlyDischargeForms"
  | "usIaFinesAndFees"
  | "usIaSupervisionLevelDowngrade"

  //// Idaho
  | "usIdCaseManagerSearch"
  | "usIdCRCFacilitySearch"
  | "usIdDistrictSearch"
  | "usIdTasksV2"
  | "crcLikeBeds"

  //// Maine
  | "usMeCaseNoteSnooze"
  | "usMoOverdueRHPilot"

  //// Michigan
  | "usMiFacilitySearch"
  | "usMiCaseManagerSearch"
  | "usMiCustodyLevelDowngrade"
  | "usMiPositiveOutcomesBanner"
  | "usMiRestrictiveHousingV2"
  | "usMiRestrictiveHousingV2Ineligible"

  //// Missouri
  | "usMoMyCaseload"
  | "customTasks"
  | "caseOverview"
  | "recentCaseNotes"
  | "usMoSarInClientsPage"
  | "usMoSearchByUnit"
  | "usMoWorkRelease"

  //// Oregon
  | "usOrEarnedDischargeSentence"

  //// North Carolina
  | "usNcCrrApprovalFlow"
  | "usNcCrrApprover"

  //// Pennsylvania
  | "usPaSpecialCircumstances"
  | "usPaUnclearEligibility"

  //// Tennessee
  | "usTnCompliantReporting2025Policy"
  | "usTnCompliantReportingWriteback"
  | "usTnDoNotMarkPendingOnDownload"
  | "usTnExpiration"
  | "usTnExpirationSubmitToTomis"
  | "usTnInitialClassification"
  | "usTnSuspensionOfDirectSupervision"
  | "usTnTEPENotesForAll"
  | "usTn2026ClassificationPolicyPilot"
  | "usTnRcafV2"
  | "usTnRcafV1"

  //// Texas
  | "enableSupervisorReviewChain"

  // INSIGHTS
  | "insightsLeadershipPageAllDistricts"
  | "insightsOnboarding"
  | "supervisorHomepageWorkflows"
  | "supervisorHomepageVitals"
  | "actionStrategies"
  | "zeroGrantsFlag"
  | "outcomesModule"
  | "reportIncorrectRosters"
  | "operationsDrilldown"
  | "operationsContactsDrilldown"
  | "operationsNumeratorDenominatorIsEnabled"
  | "insightsStaffUsage"
  | "insightsConsistentLoginPill"
  | "supervisorHomepageReviewCard"
  | "insightsSupervisorOpportunityNotifications"

  // SENTENCING
  | "offenseOverrideControls"
  | "protectiveFactors"
  | "editCountyFields"
  | "mandatoryMinimum"
  | "snoozeCompanions"
  | "splitParoleProbationOutcomes"
  | "SARBuilder"
  | "SARSignature"
  | "SARManualORAS"
  | "reactPdfSAR";

export type FeatureVariantValue = {
  activeDate?: Date;
  variant?: string;
  activeTenants?: TenantId[];
};
/**
 * For each feature, an optional activeDate can control when the user gets access.
 * If this is missing, access will be granted immediately.
 * The `variant` property can be used to segment users to different variants of the feature,
 * e.g. for A/B testing.
 */
export type FeatureVariantMapping = Record<FeatureVariant, FeatureVariantValue>;
export type FeatureVariantRecord = Partial<FeatureVariantMapping>;
export type ActiveFeatureVariantRecord = PartialRecord<
  FeatureVariant,
  Omit<FeatureVariantValue, "activeDate" | "activeTenants">
>;
export type FeatureVariantOverrideRecord = PartialRecord<
  FeatureVariant,
  boolean
>;
export const allFeatureVariants: FeatureVariantMapping = {
  TEST: {},
  usAzAdminSupervisionApprovalFlow: {},
  usTnExpiration: {},
  usTnExpirationSubmitToTomis: {},
  usCaEnableSMS: {},
  supervisionUnrestrictedSearch: {},
  formRevertButton: {},
  usMoOverdueRHPilot: {},
  insightsLeadershipPageAllDistricts: {},
  insightsOnboarding: {},
  hideDenialRevert: {},
  workflowsSupervisorSearch: {},
  supervisorHomepageWorkflows: {},
  supervisorHomepageVitals: {},
  usPaSpecialCircumstances: {},
  caseNoteSearch: {},
  clientsResidentsTableViewToggle: {},
  actionStrategies: {},
  zeroGrantsFlag: {},
  usOrEarnedDischargeSentence: {},
  offenseOverrideControls: {},
  protectiveFactors: {},
  editCountyFields: {},
  usIdCaseManagerSearch: {},
  usIdCRCFacilitySearch: {},
  usTnSuspensionOfDirectSupervision: {},
  usMeCaseNoteSnooze: {},
  outcomesModule: {},
  mandatoryMinimum: {},
  usTnCompliantReporting2025Policy: {},
  usTnCompliantReportingWriteback: {},
  usTnDoNotMarkPendingOnDownload: {},
  reportIncorrectRosters: {},
  snoozeCompanions: {},
  usIaEarlyDischargeCustomizations: {},
  usIaEarlyDischargeForms: {},
  usIaSupervisionLevelDowngrade: {},
  operationsDrilldown: {},
  operationsContactsDrilldown: {},
  operationsNumeratorDenominatorIsEnabled: {},
  usTnInitialClassification: {},
  usTn2026ClassificationPolicyPilot: {},
  usTnRcafV2: {},
  usTnRcafV1: {},
  insightsStaffUsage: {},
  insightsConsistentLoginPill: {},
  usTnTEPENotesForAll: {},
  usMoMyCaseload: {},
  caseOverview: {},
  recentCaseNotes: {},
  usMoSarInClientsPage: {},
  usMoSearchByUnit: {},
  usMoWorkRelease: {},
  usMiCaseManagerSearch: {},
  usMiCustodyLevelDowngrade: {},
  usMiPositiveOutcomesBanner: {},
  usMiFacilitySearch: {},
  usMiRestrictiveHousingV2: {},
  usMiRestrictiveHousingV2Ineligible: {},
  usNcCrrApprovalFlow: {},
  usNcCrrApprover: {},
  indefiniteSnooze: {},
  usIdDistrictSearch: {},
  usIaFinesAndFees: {},
  customTasks: {},
  taskSnoozeReason: {},
  tasksOneRowPerClient: {},
  tasksPermasnooze: {},
  tasksRoutePlanner: {},
  usPaUnclearEligibility: {},
  usIdTasksV2: {},
  crcLikeBeds: {},
  SARBuilder: {},
  SARSignature: {},
  SARManualORAS: {},
  reactPdfSAR: {},
  splitParoleProbationOutcomes: {},
  enableSupervisorReviewChain: {},
  supervisorHomepageReviewCard: {},
  insightsSupervisorOpportunityNotifications: {},
  sentenceProgressV2: {},
  hideWorkflowsOpportunities: {},
  hideWorkflowsResidentsPage: {},
  useRecordForIneligibleOpps: {},
};
export const defaultRecidivizUserFeatureVariantsActive: Partial<FeatureVariantMapping> =
  import.meta.env.VITE_DEPLOY_ENV === "production"
    ? {
        actionStrategies: { activeTenants: ["US_MI"] },
        crcLikeBeds: {},
        enableSupervisorReviewChain: { activeTenants: ["US_TX"] },
        insightsOnboarding: {},
        outcomesModule: {
          activeTenants: ["US_AZ", "US_CA", "US_ID", "US_MI", "US_TN"],
        },
        supervisionUnrestrictedSearch: {},
        supervisorHomepageReviewCard: { activeTenants: ["US_IA"] },
        supervisorHomepageWorkflows: {},
        supervisorHomepageVitals: {
          activeTenants: ["US_ID", "US_ND", "US_TX"],
        },
        operationsDrilldown: { activeTenants: ["US_ID", "US_ND", "US_TX"] },
        operationsContactsDrilldown: { activeTenants: ["US_TX"] },
        operationsNumeratorDenominatorIsEnabled: { activeTenants: ["US_TX"] },
        insightsStaffUsage: {
          activeTenants: ["US_ID", "US_UT", "US_IA", "US_MI", "US_TX"],
        },
        insightsConsistentLoginPill: { activeTenants: ["US_MI"] },
        clientsResidentsTableViewToggle: {},
        usIdCaseManagerSearch: {},
        usIdCRCFacilitySearch: {},
        usMiCaseManagerSearch: {},
        usMiCustodyLevelDowngrade: {},
        usMiRestrictiveHousingV2Ineligible: { activeTenants: ["US_MI"] },
        usMiFacilitySearch: {},
        usMiRestrictiveHousingV2: {},
        usMoOverdueRHPilot: {},
        usOrEarnedDischargeSentence: {},
        usTnExpiration: {},
        usTnExpirationSubmitToTomis: {},
        usTnSuspensionOfDirectSupervision: {},
        zeroGrantsFlag: { activeTenants: ["US_ID", "US_MI", "US_TN", "US_PA"] },
        usTnCompliantReporting2025Policy: {},
        usTnInitialClassification: {},
        usTnTEPENotesForAll: {},
        usMoSarInClientsPage: { activeTenants: ["US_MO"] },
        usMoSearchByUnit: {},
        usMoWorkRelease: {},
        indefiniteSnooze: { activeTenants: ["US_IA"] },
        usIaEarlyDischargeForms: {},
        usIaFinesAndFees: {},
        usIaSupervisionLevelDowngrade: {},
        hideDenialRevert: { activeTenants: ["US_AZ"] },
        usIdTasksV2: {},
        caseOverview: { activeTenants: ["US_MO"] },
        recentCaseNotes: { activeTenants: ["US_MO"] },
        customTasks: { activeTenants: ["US_MO"] },
        tasksOneRowPerClient: { activeTenants: ["US_MO"] },
        tasksRoutePlanner: { activeTenants: ["US_TX"] },
        hideWorkflowsResidentsPage: { activeTenants: ["US_NC"] },
        sentenceProgressV2: { activeTenants: ["US_ND"] },
      }
    : {
        ...allFeatureVariants,
        usOrEarnedDischargeSentence: undefined,
        usMeCaseNoteSnooze: isDemoMode() ? undefined : {},
        outcomesModule: {
          activeTenants: ["US_AZ", "US_CA", "US_ID", "US_MI", "US_TN"],
        },
        usTnCompliantReporting2025Policy: isDemoMode() ? undefined : {},

        // TODO(recidiviz-data/#75828): Remove once we support 2026 versions in demo mode
        usTn2026ClassificationPolicyPilot: isDemoMode() ? undefined : {},
        usTnRcafV2: isDemoMode() ? undefined : {},
        usTnRcafV1: isDemoMode() ? undefined : {},

        operationsDrilldown: { activeTenants: ["US_ID", "US_ND", "US_TX"] },
        operationsContactsDrilldown: { activeTenants: ["US_TX"] },
        operationsNumeratorDenominatorIsEnabled: { activeTenants: ["US_TX"] },
        reportIncorrectRosters: {
          activeTenants: ["US_TN"],
        },
        caseOverview: { activeTenants: ["US_MO"] },
        recentCaseNotes: { activeTenants: ["US_MO"] },
        tasksPermasnooze: { activeTenants: ["US_MO"] },
        usMoMyCaseload: { activeTenants: ["US_MO"] },
        usMoSarInClientsPage: { activeTenants: ["US_MO"] },
        splitParoleProbationOutcomes: { activeTenants: ["US_MI"] },
        customTasks: { activeTenants: ["US_MO"] },
        tasksOneRowPerClient: { activeTenants: ["US_MO"] },
        tasksRoutePlanner: { activeTenants: ["US_TX", "US_ID"] },
        hideDenialRevert: { activeTenants: ["US_AZ"] },
        SARBuilder: { activeTenants: ["US_MO"] },
        SARSignature: { activeTenants: ["US_MO"] },
        SARManualORAS: { activeTenants: ["US_MO"] },
        sentenceProgressV2: { activeTenants: ["US_ND"] },
        hideWorkflowsOpportunities: undefined,
        hideWorkflowsResidentsPage: { activeTenants: ["US_NC"] },
      };

export type LanternMethodologyByTenant = {
  [key in LanternTenants]: LanternMethodology;
};

export type LanternMethodology = {
  [k: string]: {
    id: number;
    title?: string;
    methodology: string;
  }[];
};
