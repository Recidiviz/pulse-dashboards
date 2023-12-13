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
import { UserRole } from "../FirestoreStore";
import { CSG, RECIDIVIZ_TENANT } from "../tenants";
import * as workflows from "./TenantStore/dashboardTenants";
import * as lantern from "./TenantStore/lanternTenants";
import * as pathways from "./TenantStore/pathwaysTenants";

export type LanternTenants = typeof lantern.LANTERN_TENANTS[number];
export type PathwaysTenants = typeof pathways.PATHWAYS_TENANTS[number];

export function isPathwaysTenantId(
  tenantId: TenantId | undefined
): tenantId is PathwaysTenants {
  return pathways.PATHWAYS_TENANTS.includes(tenantId as PathwaysTenants);
}

const InternalTenantIds = [RECIDIVIZ_TENANT, CSG] as const;

const TenantIds = [
  lantern.US_MO,
  lantern.US_PA,
  workflows.US_CA,
  pathways.US_CO,
  pathways.US_ID,
  pathways.US_TN,
  pathways.US_ME,
  pathways.US_MI,
  pathways.US_NC,
  pathways.US_ND,
  workflows.US_OR,
  RECIDIVIZ_TENANT,
  CSG,
  ...InternalTenantIds,
] as const;

export type TenantConfigId = typeof TenantIds[number];
export type InternalTenantId = typeof InternalTenantIds[number];
export type TenantId = Exclude<
  TenantConfigId,
  typeof InternalTenantIds[number]
>;

export type UserAppMetadata = {
  stateCode: Lowercase<TenantId> | Lowercase<InternalTenantId>;
  allowedStates?: TenantId[];
  allowedSupervisionLocationIds?: string[];
  allowedSupervisionLocationLevel?: string;
  routes?: Record<string, boolean>;
  featureVariants?: Record<string, Record<string, string>>;
  demoModeFeatureVariants?: Record<string, Record<string, string>>;
  userHash?: string;
  pseudonymizedId?: string;
  segmentId?: string;
  intercomId?: string;
  role?: UserRole;
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
  | "responsiveRevamp"
  | "usIdCRC"
  | "usIdExpandedCRC"
  | "usCaEnableSMS"
  | "usTnAnnualReclassification"
  | "outliersClientDetail"
  | "usNdWriteToDocstars"
  | "formRevertButton";
export type FeatureVariantValue = { activeDate?: Date; variant?: string };
/**
 * For each feature, an optional activeDate can control when the user gets access.
 * If this is missing, access will be granted immediately.
 * The `variant` property can be used to segment users to different variants of the feature,
 * e.g. for A/B testing.
 */
export type FeatureVariantMapping = Record<FeatureVariant, FeatureVariantValue>;
export type FeatureVariantRecord = Partial<FeatureVariantMapping>;
export type ActiveFeatureVariantRecord = Partial<
  Record<FeatureVariant, Omit<FeatureVariantValue, "activeDate">>
>;
const allFeatureVariants: FeatureVariantMapping = {
  TEST: {},
  CompliantReportingAlmostEligible: {},
  usMeWorkRelease: {},
  usMeFurloughRelease: {},
  usTnExpiration: {},
  usTnExpirationSubmitToTomis: {},
  responsiveRevamp: {},
  usIdCRC: {},
  usIdExpandedCRC: {},
  usCaEnableSMS: {},
  usTnAnnualReclassification: {},
  enableSnooze: {},
  outliersClientDetail: {},
  usNdWriteToDocstars: {},
  supervisionUnrestrictedSearch: {},
  formRevertButton: {},
};
export const defaultFeatureVariantsActive: ActiveFeatureVariantRecord =
  process.env.REACT_APP_DEPLOY_ENV === "production"
    ? {
        CompliantReportingAlmostEligible: {},
        responsiveRevamp: {},
        usTnExpiration: {},
        usTnExpirationSubmitToTomis: {},
        usMeFurloughRelease: {},
        usMeWorkRelease: {},
        usTnAnnualReclassification: {},
        supervisionUnrestrictedSearch: {},
      }
    : allFeatureVariants;

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
