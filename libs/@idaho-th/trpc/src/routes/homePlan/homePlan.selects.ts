// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import type { Prisma } from "~@idaho-th/prisma/client";
import { HOUSING_PROVIDER_CONTACT_SELECT } from "~@idaho-th/trpc/routes/housing-common/housingProviderContact";

export const HOME_PLAN_RELEASE_TASK_SELECT = {
  id: true,
  taskType: true,
  completed: true,
  completedAt: true,
  completedByRole: true,
  completedByPseudonymizedId: true,
  note: true,
  date: true,
} as const satisfies Prisma.HousingApplicationReleaseTaskSelect;

export const HOME_PLAN_SELECT = {
  id: true,
  applicationId: true,
  type: true,
  address: true,
  selectedProviderId: true,
  createdByStaffPseudonymizedId: true,
  createdAt: true,
  updatedAt: true,
  releaseDecision: true,
  homePlanInvestigation: true,
  approvalsAt: true,
  // The organization, plus the one user staff are shown as its contact — see
  // ORGANIZATION_CONTACT_SELECT. The email/contactPhone/contactName columns no
  // longer exist on this table; its people are HousingProviderUser rows now.
  selectedProvider: {
    select: {
      id: true,
      name: true,
      ...HOUSING_PROVIDER_CONTACT_SELECT,
    },
  },
  releaseTasks: {
    select: HOME_PLAN_RELEASE_TASK_SELECT,
    orderBy: { taskType: "asc" },
  },
} as const satisfies Prisma.HousingApplicationHomePlanSelect;

const HOUSING_APPLICATION_CORE_SELECT = {
  id: true,
  sentToProvidersAt: true,
} as const satisfies Pick<
  Prisma.HousingApplicationSelect,
  "id" | "sentToProvidersAt"
>;

const HOME_PLAN_ON_APPLICATION_FULL_SELECT = {
  homePlan: { select: HOME_PLAN_SELECT },
} as const satisfies Pick<Prisma.HousingApplicationSelect, "homePlan">;

const HOME_PLAN_ON_APPLICATION_ID_SELECT = {
  homePlan: { select: { id: true } },
} as const satisfies Pick<Prisma.HousingApplicationSelect, "homePlan">;

const STAFF_APPLICATION_STAGE_ON_APPLICATION_SELECT = {
  staffApplication: {
    select: { stage: true, paroleCommissionDecision: true },
  },
} as const satisfies Pick<Prisma.HousingApplicationSelect, "staffApplication">;

const STAFF_APPLICATION_APPROVALS_ON_APPLICATION_SELECT = {
  staffApplication: {
    select: { stage: true, subStage: true, paroleCommissionDecision: true },
  },
} as const satisfies Pick<Prisma.HousingApplicationSelect, "staffApplication">;

const PROVIDER_APPLICATION_ID_FIELDS = {
  id: true,
  providerId: true,
} as const satisfies Pick<
  Prisma.ProviderHousingApplicationSelect,
  "id" | "providerId"
>;

const PROVIDER_APPLICATION_ACCEPT_FIELDS = {
  ...PROVIDER_APPLICATION_ID_FIELDS,
  stage: true,
  subStage: true,
  provider: { select: { name: true } },
} as const satisfies Pick<
  Prisma.ProviderHousingApplicationSelect,
  "id" | "providerId" | "stage" | "subStage" | "provider"
>;

const PROVIDER_APPLICATIONS_ID_ON_APPLICATION_SELECT = {
  providerApplications: {
    select: PROVIDER_APPLICATION_ID_FIELDS,
  },
} as const satisfies Pick<
  Prisma.HousingApplicationSelect,
  "providerApplications"
>;

const PROVIDER_APPLICATIONS_ACCEPT_ON_APPLICATION_SELECT = {
  providerApplications: {
    select: PROVIDER_APPLICATION_ACCEPT_FIELDS,
  },
} as const satisfies Pick<
  Prisma.HousingApplicationSelect,
  "providerApplications"
>;

const STAFF_HOME_PLAN_WITH_RELEASE_TASKS_SELECT = {
  ...HOUSING_APPLICATION_CORE_SELECT,
  ...HOME_PLAN_ON_APPLICATION_FULL_SELECT,
  ...STAFF_APPLICATION_STAGE_ON_APPLICATION_SELECT,
} as const;

const PROVIDER_HOME_PLAN_APPLICATION_BASE_SELECT = {
  id: true,
  // paroleCommissionDecision feeds the collapsed status badge only; the mapper never
  // returns it to a provider.
  staffApplication: {
    select: { stage: true, paroleCommissionDecision: true },
  },
  homePlan: { select: HOME_PLAN_SELECT },
} as const satisfies Pick<
  Prisma.HousingApplicationSelect,
  "id" | "staffApplication" | "homePlan"
>;

/**
 * Narrows the application's matches to the organization the caller is acting
 * as. `providerId` is the verified active organization from `ctx.providerId`,
 * never the person's pseudonymized id — colleagues share one queue, and an
 * application is matched to an organization at most once.
 */
function scopedProviderApplicationsSelect(
  providerId: string,
  select: Prisma.ProviderHousingApplicationSelect,
) {
  return {
    where: { providerId },
    select,
    take: 1,
  };
}

export const ACCEPT_HOME_PLAN_APPLICATION_SELECT = {
  ...HOUSING_APPLICATION_CORE_SELECT,
  ...HOME_PLAN_ON_APPLICATION_ID_SELECT,
  ...STAFF_APPLICATION_STAGE_ON_APPLICATION_SELECT,
  ...PROVIDER_APPLICATIONS_ACCEPT_ON_APPLICATION_SELECT,
} as const satisfies Prisma.HousingApplicationSelect;

export const STAFF_HOME_PLAN_APPLICATION_SELECT = {
  ...STAFF_HOME_PLAN_WITH_RELEASE_TASKS_SELECT,
  ...PROVIDER_APPLICATIONS_ACCEPT_ON_APPLICATION_SELECT,
} as const satisfies Prisma.HousingApplicationSelect;

export const SET_HOME_PLAN_APPROVALS_APPLICATION_SELECT = {
  ...HOUSING_APPLICATION_CORE_SELECT,
  // Q6 decides the cohort. isRider or not.
  formData: true,
  ...HOME_PLAN_ON_APPLICATION_FULL_SELECT,
  ...STAFF_APPLICATION_APPROVALS_ON_APPLICATION_SELECT,
  ...PROVIDER_APPLICATIONS_ID_ON_APPLICATION_SELECT,
} as const satisfies Prisma.HousingApplicationSelect;

export const STAFF_TOGGLE_RELEASE_TASK_APPLICATION_SELECT = {
  ...STAFF_HOME_PLAN_WITH_RELEASE_TASKS_SELECT,
  ...PROVIDER_APPLICATIONS_ID_ON_APPLICATION_SELECT,
} as const satisfies Prisma.HousingApplicationSelect;

export function providerHomePlanApplicationSelect(providerId: string) {
  return {
    ...PROVIDER_HOME_PLAN_APPLICATION_BASE_SELECT,
    providerApplications: scopedProviderApplicationsSelect(providerId, {
      providerId: true,
    }),
  } satisfies Prisma.HousingApplicationSelect;
}

export function providerToggleReleaseTaskApplicationSelect(providerId: string) {
  return {
    ...PROVIDER_HOME_PLAN_APPLICATION_BASE_SELECT,
    providerApplications: scopedProviderApplicationsSelect(
      providerId,
      PROVIDER_APPLICATION_ID_FIELDS,
    ),
  } satisfies Prisma.HousingApplicationSelect;
}
