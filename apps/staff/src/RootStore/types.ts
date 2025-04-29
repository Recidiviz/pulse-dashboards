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
  | "submittedOpportunityStatus"
  | "personSpecificOppBanners"
  | "sortableOpportunityTabs"
  | "fullWidthTimeline"
  | "usOrEarnedDischargeSentence"
  | "oppTabSubcategories"
  | "usIdCRCFacilitySearch"
  | "usIdCaseManagerSearch"
  | "opportunityTableView"
  | "usTnSuspensionOfDirectSupervision"
  | "usMeCaseNoteSnooze"
  | "usTnCompliantReporting2025Policy"
  | "tableMultiSortEnabled"
  | "supervisionTasksNavLink"
  | "usIaEarlyDischargeCustomizations"
  // INSIGHTS
  | "insightsLeadershipPageAllDistricts"
  | "insightsOnboarding"
  | "supervisorHomepageWorkflows"
  | "supervisorHomepageVitals"
  | "actionStrategies"
  | "zeroGrantsFlag"
  | "outcomesModule"
  | "reportIncorrectRosters"
  // WORKFLOWS & INSIGHTS
  | "lastSyncedDate"
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
export type ActiveFeatureVariantRecord = Partial<
  Record<
    FeatureVariant,
    Omit<FeatureVariantValue, "activeDate" | "activeTenants">
  >
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
  lastSyncedDate: {},
  caseNoteSearch: {},
  actionStrategies: {},
  submittedOpportunityStatus: {},
  personSpecificOppBanners: {},
  sortableOpportunityTabs: {},
  fullWidthTimeline: {},
  zeroGrantsFlag: {},
  usOrEarnedDischargeSentence: {},
  oppTabSubcategories: {},
  offenseOverrideControls: {},
  protectiveFactors: {},
  editCountyFields: {},
  usIdCaseManagerSearch: {},
  usIdCRCFacilitySearch: {},
  opportunityTableView: {},
  usTnSuspensionOfDirectSupervision: {},
  usMeCaseNoteSnooze: {},
  outcomesModule: {},
  mandatoryMinimum: {},
  usTnCompliantReporting2025Policy: {},
  reportIncorrectRosters: {},
  tableMultiSortEnabled: {},
  supervisionTasksNavLink: {},
  snoozeCompanions: {},
  usIaEarlyDischargeCustomizations: {},
};
export const defaultRecidivizUserFeatureVariantsActive: Partial<FeatureVariantMapping> =
  import.meta.env.VITE_DEPLOY_ENV === "production"
    ? {
        actionStrategies: { activeTenants: ["US_MI"] },
        disableSnoozeSlider: { activeTenants: ["US_MO"] },
        fullWidthTimeline: { activeTenants: ["US_AZ", "US_UT"] },
        insightsOnboarding: {},
        opportunityTableView: { activeTenants: ["US_TX"] },
        oppTabSubcategories: { activeTenants: ["US_AZ", "US_UT"] },
        outcomesModule: { activeTenants: ["US_CA", "US_ID", "US_MI", "US_TN"] },
        sortableOpportunityTabs: {
          activeTenants: ["US_OR", "US_ME", "US_MI", "US_AZ", "US_UT"],
        },
        submittedOpportunityStatus: {
          activeTenants: ["US_OR", "US_ME", "US_MI", "US_AZ", "US_PA", "US_UT"],
        },
        supervisionUnrestrictedSearch: {},
        supervisorHomepageWorkflows: {},
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
      }
    : {
        ...allFeatureVariants,
        disableSnoozeSlider: { activeTenants: ["US_MO"] },
        opportunityTableView: isDemoMode() ? undefined : {},
        // Currently disabled because the last synced date doesn't exist on the backend yet.
        lastSyncedDate: undefined,
        // Undefined so that Recidiviz users see both FVs in staging
        usOrEarnedDischargeSentence: undefined,
        personSpecificOppBanners: undefined,
        usMeCaseNoteSnooze: isDemoMode() ? undefined : {},
        outcomesModule: {
          activeTenants: ["US_CA", "US_ID", "US_MI", "US_TN"],
        },
        usTnCompliantReporting2025Policy: isDemoMode() ? undefined : {},
        tableMultiSortEnabled: undefined,
        supervisionTasksNavLink: { activeTenants: ["US_ID"] },
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
