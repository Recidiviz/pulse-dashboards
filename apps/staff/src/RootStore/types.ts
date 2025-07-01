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
};

// TEST is useful for testing, as the name suggests,
// but also so that we don't have an empty union when there are no feature variants in use
export type FeatureVariant =
  | "TEST"
  // WORKFLOWS
  | "disableSnoozeSlider"
  | "supervisionUnrestrictedSearch"
  | "usAzFacilitySearch"
  | "usTnExpiration"
  | "usTnExpirationSubmitToTomis"
  | "usCaEnableSMS"
  | "usMoOverdueRHPilot"
  | "formRevertButton"
  | "hideDenialRevert"
  | "workflowsSupervisorSearch"
  | "usPaSpecialCircumstances"
  | "caseNoteSearch"
  | "usOrEarnedDischargeSentence"
  | "usIdCRCFacilitySearch"
  | "usIdCaseManagerSearch"
  | "usTnSuspensionOfDirectSupervision"
  | "usMeCaseNoteSnooze"
  | "usTnCompliantReporting2025Policy"
  | "supervisionTasksNavLink"
  | "usIaEarlyDischargeCustomizations"
  | "usIaEarlyDischargeForms"
  | "usTnInitialClassification"
  | "usTnTEPENotesForAll"
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
  | "insightsStaffUsage"
  // SENTENCING
  | "offenseOverrideControls"
  | "protectiveFactors"
  | "editCountyFields"
  | "mandatoryMinimum"
  | "snoozeCompanions";

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
  disableSnoozeSlider: {},
  usAzFacilitySearch: {},
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
  reportIncorrectRosters: {},
  supervisionTasksNavLink: {},
  snoozeCompanions: {},
  usIaEarlyDischargeCustomizations: {},
  usIaEarlyDischargeForms: {},
  operationsDrilldown: {},
  usTnInitialClassification: {},
  insightsStaffUsage: {},
  usTnTEPENotesForAll: {},
};
export const defaultRecidivizUserFeatureVariantsActive: Partial<FeatureVariantMapping> =
  import.meta.env.VITE_DEPLOY_ENV === "production"
    ? {
        actionStrategies: { activeTenants: ["US_MI"] },
        disableSnoozeSlider: { activeTenants: ["US_MO"] },
        insightsOnboarding: {},
        outcomesModule: { activeTenants: ["US_CA", "US_ID", "US_MI", "US_TN"] },
        supervisionUnrestrictedSearch: {},
        supervisorHomepageWorkflows: {},
        supervisorHomepageVitals: { activeTenants: ["US_ID", "US_ND"] },
        operationsDrilldown: { activeTenants: ["US_ID", "US_ND"] },
        usAzFacilitySearch: {},
        usIdCaseManagerSearch: {},
        usIdCRCFacilitySearch: {},
        usMoOverdueRHPilot: {},
        usOrEarnedDischargeSentence: {},
        usTnExpiration: {},
        usTnExpirationSubmitToTomis: {},
        usTnSuspensionOfDirectSupervision: {},
        zeroGrantsFlag: { activeTenants: ["US_ID", "US_MI", "US_TN", "US_PA"] },
        supervisionTasksNavLink: { activeTenants: ["US_ID"] },
        usTnCompliantReporting2025Policy: {},
        usTnInitialClassification: {},
        usTnTEPENotesForAll: {},
      }
    : {
        ...allFeatureVariants,
        disableSnoozeSlider: { activeTenants: ["US_MO"] },
        // Currently disabled because the last synced date doesn't exist on the backend yet.
        // Undefined so that Recidiviz users see both FVs in staging
        usOrEarnedDischargeSentence: undefined,
        usMeCaseNoteSnooze: isDemoMode() ? undefined : {},
        outcomesModule: {
          activeTenants: ["US_CA", "US_ID", "US_MI", "US_TN"],
        },
        usTnCompliantReporting2025Policy: isDemoMode() ? undefined : {},
        supervisionTasksNavLink: { activeTenants: ["US_ID", "US_NE"] },
        operationsDrilldown: { activeTenants: ["US_ID", "US_ND"] },
        reportIncorrectRosters: {
          activeTenants: ["US_TN"],
        },
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
