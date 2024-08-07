// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { CSG, RECIDIVIZ_TENANT } from "../tenants";
import * as workflows from "./TenantStore/dashboardTenants";
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

const InternalTenantIds = [RECIDIVIZ_TENANT, CSG] as const;

export const TenantIds = [
  lantern.US_MO,
  workflows.US_AR,
  workflows.US_PA,
  workflows.US_CA,
  pathways.US_CO,
  pathways.US_ID,
  pathways.US_TN,
  pathways.US_ME,
  pathways.US_MI,
  pathways.US_NC,
  pathways.US_ND,
  workflows.US_OR,
] as const;

export type InternalTenantId = (typeof InternalTenantIds)[number];
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
  | "enableSnooze"
  | "supervisionUnrestrictedSearch"
  | "CompliantReportingAlmostEligible"
  | "usMeWorkRelease"
  | "usMeFurloughRelease"
  | "usTnExpiration"
  | "usTnExpirationSubmitToTomis"
  | "usIdCRC"
  | "usIdExpandedCRC"
  | "usCaEnableSMS"
  | "usNdWriteToDocstars"
  | "usNdCheckboxDocstars"
  | "usMeCustodyLevelReview"
  | "usMeAnnualReclassificationReview"
  | "usMoOverdueRHPilot"
  | "formRevertButton"
  | "insightsLeadershipPageAllDistricts"
  | "insightsOnboarding"
  | "hideDenialRevert"
  | "opportunityConfigurationAPI"
  | "workflowsSupervisorSearch"
  | "isolateFormUpdates"
  | "supervisorHomepage"
  | "supervisorHomepageWorkflows"
  | "usPaSpecialCircumstances"
  | "opportunityPolicyCopy"
  | "interCandidateNavigation"
  | "lastSyncedDate";
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
  CompliantReportingAlmostEligible: {},
  usMeWorkRelease: {},
  usMeFurloughRelease: {},
  usTnExpiration: {},
  usTnExpirationSubmitToTomis: {},
  usIdCRC: {},
  usIdExpandedCRC: {},
  usCaEnableSMS: {},
  enableSnooze: {},
  usNdWriteToDocstars: {},
  usNdCheckboxDocstars: {},
  supervisionUnrestrictedSearch: {},
  formRevertButton: {},
  usMoOverdueRHPilot: {},
  insightsLeadershipPageAllDistricts: {},
  insightsOnboarding: {},
  hideDenialRevert: {},
  opportunityConfigurationAPI: {},
  usMeCustodyLevelReview: {},
  usMeAnnualReclassificationReview: {},
  workflowsSupervisorSearch: {},
  isolateFormUpdates: {},
  supervisorHomepage: {},
  supervisorHomepageWorkflows: {},
  usPaSpecialCircumstances: {},
  opportunityPolicyCopy: {},
  interCandidateNavigation: {},
  lastSyncedDate: {},
};
export const defaultFeatureVariantsActive: Partial<FeatureVariantMapping> =
  import.meta.env.VITE_DEPLOY_ENV === "production"
    ? {
        CompliantReportingAlmostEligible: {},
        usIdCRC: {},
        usIdExpandedCRC: {},
        usTnExpiration: {},
        usTnExpirationSubmitToTomis: {},
        usMeFurloughRelease: {},
        usMeWorkRelease: {},
        supervisionUnrestrictedSearch: {},
        usMoOverdueRHPilot: {},
        enableSnooze: {},
        insightsOnboarding: {},
        isolateFormUpdates: {},
        usNdCheckboxDocstars: {},
      }
    : {
        ...allFeatureVariants,
        supervisorHomepage: undefined,
        // Currently disabled because the last synced date doesn't exist on the backend yet.
        lastSyncedDate: undefined,
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
