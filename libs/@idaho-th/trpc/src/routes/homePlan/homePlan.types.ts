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

import type { z } from "zod";

import type {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  HomePlanInvestigationResult,
  HomePlanType,
  ParoleCommissionDecision,
  Prisma,
  PrismaClient,
  ReleaseDecision,
  ReleaseTaskType,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";
import type {
  ActiveReleaseTaskType,
  HomePlanApprovalsBadge,
} from "~@idaho-th/shared";
import type { HousingProviderContact } from "~@idaho-th/trpc/routes/housing-common/housingProviderContact";

import type {
  acceptProviderAsHomePlanSchema,
  getHomePlanSchema,
  setApprovalsSchema,
  setManualAddressHomePlanSchema,
  toggleReleaseTaskSchema,
  updateReleaseTaskDetailSchema,
} from "./homePlan.schema";
import {
  ACCEPT_HOME_PLAN_APPLICATION_SELECT,
  HOME_PLAN_SELECT,
  providerHomePlanApplicationSelect,
  providerToggleReleaseTaskApplicationSelect,
  SET_HOME_PLAN_APPROVALS_APPLICATION_SELECT,
  STAFF_HOME_PLAN_APPLICATION_SELECT,
  STAFF_TOGGLE_RELEASE_TASK_APPLICATION_SELECT,
} from "./homePlan.selects";

type WithRequiredStaffApplication<TRow extends { staffApplication: unknown }> =
  Omit<TRow, "staffApplication"> & {
    staffApplication: NonNullable<TRow["staffApplication"]>;
  };

type WithRequiredHomePlan<TRow extends { homePlan: unknown }> = Omit<
  TRow,
  "homePlan"
> & {
  homePlan: NonNullable<TRow["homePlan"]>;
};

export type DbClient = Prisma.TransactionClient | PrismaClient;

export type HomePlanTransactionClient = Prisma.TransactionClient;

export type HomePlanPermissions = {
  canSetHomePlan: boolean;
  canSetApprovals: boolean;
  canToggleReleaseTasks: boolean;
  isSelectedProvider: boolean;
};

export type HomePlanReleaseTaskView = {
  taskType: ReleaseTaskType;
  completed: boolean;
  completedAt: Date | null;
  completedByRole: TaskCompletedByRole | null;
  updatedByOtherParty: boolean;
  note: string | null;
  date: Date | null;
};

export type HomePlanApprovalsView = {
  // Null when the case left Approvals without either decision recorded — the
  // panel shows the label with no badge rather than claiming an outcome.
  badge: HomePlanApprovalsBadge | null;
  // Providers only ever get the badge; the individual decisions are the CM's.
  releaseDecision: ReleaseDecision | null;
  homePlanInvestigation: HomePlanInvestigationResult | null;
  approvalsAt: Date | null;
};

/**
 * The organization selected as the home plan.
 *
 * `contact` is the organization's first assigned user, for staff to call — a
 * display convenience only (see {@link toHousingProviderContact}), null when the
 * organization has no users. It is always null for a provider audience: the
 * selected organization need not be the viewer's own.
 */
export type HomePlanProviderView = {
  providerId: string;
  name: string;
  contact: HousingProviderContact | null;
  status: "ACCEPTED_AS_HOME_PLAN";
};

export type HomePlanView = {
  type: HomePlanType;
  address: string | null;
  provider: HomePlanProviderView | null;
  createdAt: Date;
  updatedAt: Date;
};

export type GetHomePlanResult = {
  applicationId: string;
  stage: ApplicationStage;
  homePlan: HomePlanView | null;
  approvals: HomePlanApprovalsView | null;
  releaseTasks: {
    active: boolean;
    completedCount: number;
    totalCount: number;
    tasks: HomePlanReleaseTaskView[];
  } | null;
  permissions: HomePlanPermissions;
  emptyTabMessage: string | null;
};

export type GetHomePlanInput = z.infer<typeof getHomePlanSchema>;
export type AcceptProviderInput = z.infer<
  typeof acceptProviderAsHomePlanSchema
>;
export type SetManualAddressInput = z.infer<
  typeof setManualAddressHomePlanSchema
>;
export type SetApprovalsInput = z.infer<typeof setApprovalsSchema>;

// Only one release-side decision is ever set: the Parole Commission's for a
// Termer/PV, the court's (releaseDecision) for a Rider.
export type ApprovalsDecisions = {
  paroleCommissionDecision: ParoleCommissionDecision | null;
  releaseDecision: ReleaseDecision | null;
  homePlanInvestigation: HomePlanInvestigationResult | null;
};

export type ToggleReleaseTaskInput = z.infer<typeof toggleReleaseTaskSchema>;
export type UpdateReleaseTaskDetailInput = z.infer<
  typeof updateReleaseTaskDetailSchema
>;

export type PersistHomePlanMutationViewer =
  | { role: typeof TaskCompletedByRole.STAFF; sentToProvidersAt: Date | null }
  | { role: typeof TaskCompletedByRole.PROVIDER };

export type HomePlanRow = Prisma.HousingApplicationHomePlanGetPayload<{
  select: typeof HOME_PLAN_SELECT;
}>;

export type AcceptHomePlanApplicationRow = Prisma.HousingApplicationGetPayload<{
  select: typeof ACCEPT_HOME_PLAN_APPLICATION_SELECT;
}>;

export type AcceptHomePlanApplicationRowWithStaff =
  WithRequiredStaffApplication<AcceptHomePlanApplicationRow>;

export type StaffHomePlanViewRow = Prisma.HousingApplicationGetPayload<{
  select: typeof STAFF_HOME_PLAN_APPLICATION_SELECT;
}>;

export type StaffHomePlanViewRowWithStaff =
  WithRequiredStaffApplication<StaffHomePlanViewRow>;

export type SetHomePlanApprovalsApplicationRow =
  Prisma.HousingApplicationGetPayload<{
    select: typeof SET_HOME_PLAN_APPROVALS_APPLICATION_SELECT;
  }>;

export type SetHomePlanApprovalsApplicationRowWithStaff =
  WithRequiredStaffApplication<SetHomePlanApprovalsApplicationRow>;

export type StaffToggleReleaseTaskRow = Prisma.HousingApplicationGetPayload<{
  select: typeof STAFF_TOGGLE_RELEASE_TASK_APPLICATION_SELECT;
}>;

export type StaffToggleReleaseTaskRowWithStaff =
  WithRequiredStaffApplication<StaffToggleReleaseTaskRow>;

export type ProviderHomePlanViewRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<typeof providerHomePlanApplicationSelect>;
}>;

export type ProviderHomePlanViewRowWithStaff =
  WithRequiredStaffApplication<ProviderHomePlanViewRow>;

export type ProviderToggleReleaseTaskRow = Prisma.HousingApplicationGetPayload<{
  select: ReturnType<typeof providerToggleReleaseTaskApplicationSelect>;
}>;

export type ProviderToggleReleaseTaskRowWithStaff =
  WithRequiredStaffApplication<ProviderToggleReleaseTaskRow> &
    WithRequiredHomePlan<ProviderToggleReleaseTaskRow>;

/**
 * Who is toggling a release task. For a provider the two identifiers mean
 * different things and are both required: `providerId` is the verified active
 * organization and scopes every query, while `pseudonymizedId` is the person
 * and is recorded as the task's completer.
 */
export type ToggleReleaseTaskCaller =
  | { role: typeof TaskCompletedByRole.STAFF; pseudonymizedId: string }
  | {
      role: typeof TaskCompletedByRole.PROVIDER;
      pseudonymizedId: string;
      providerId: string;
    };

export type ToggleReleaseTaskActor =
  | { role: typeof TaskCompletedByRole.STAFF; pseudonymizedId: string }
  | {
      role: typeof TaskCompletedByRole.PROVIDER;
      pseudonymizedId: string;
      providerId: string;
    };

export type ToggleReleaseTaskTarget = {
  taskId: string;
  selectedProviderApplicationId: string | null;
  releaseTasks: HomePlanRow["releaseTasks"];
  isManualAddressPlan: boolean;
};

export type AcceptProviderHomePlanTarget = {
  providerId: string;
  providerName: string;
  selectedProviderApplicationId: string;
};

export type ReleaseTaskCompletionState = Record<ActiveReleaseTaskType, boolean>;

export type ReleaseStageStatuses = {
  staffStatus: ApplicationStatus;
  selectedProviderStatus: ApplicationStatus;
};

export type AcceptHomePlanStaffUpdate = {
  stage: ApplicationStage;
  status: ApplicationStatus;
};

export type AcceptHomePlanProviderUpdate = {
  providerApplicationId: string;
  stage: ApplicationStage;
  subStage: ApplicationSubStage;
  status: ApplicationStatus;
};
