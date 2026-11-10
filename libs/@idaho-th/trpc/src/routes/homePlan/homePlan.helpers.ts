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

import { TRPCError } from "@trpc/server";

import {
  ApplicationStage,
  ApplicationSubStage,
  HomePlanInvestigationResult,
  HomePlanType,
  ReleaseTaskType,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";
import type { ActiveReleaseTaskType } from "~@idaho-th/shared";
import {
  isRequiredReleaseTaskDetailMissing,
  RELEASE_TASK_DEFS,
  ReleaseTaskOwnerRole,
} from "~@idaho-th/shared";
import {
  assertStaffCaseModifiable,
  HOUSING_APPLICATION_NOT_FOUND,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import {
  buildApplicationWhereForProvider,
  isRiderFormData,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";

import {
  ACCEPT_HOME_PLAN_APPLICATION_SELECT,
  HOME_PLAN_SELECT,
  providerHomePlanApplicationSelect,
  providerToggleReleaseTaskApplicationSelect,
  SET_HOME_PLAN_APPROVALS_APPLICATION_SELECT,
  STAFF_HOME_PLAN_APPLICATION_SELECT,
  STAFF_TOGGLE_RELEASE_TASK_APPLICATION_SELECT,
} from "./homePlan.selects";
import type {
  AcceptHomePlanApplicationRow,
  AcceptHomePlanApplicationRowWithStaff,
  AcceptProviderHomePlanTarget,
  ApprovalsDecisions,
  DbClient,
  HomePlanRow,
  ProviderHomePlanViewRow,
  ProviderHomePlanViewRowWithStaff,
  ProviderToggleReleaseTaskRow,
  ProviderToggleReleaseTaskRowWithStaff,
  SetApprovalsInput,
  SetHomePlanApprovalsApplicationRow,
  SetHomePlanApprovalsApplicationRowWithStaff,
  StaffHomePlanViewRow,
  StaffHomePlanViewRowWithStaff,
  StaffToggleReleaseTaskRow,
  StaffToggleReleaseTaskRowWithStaff,
  ToggleReleaseTaskActor,
  ToggleReleaseTaskTarget,
} from "./homePlan.types";

export const HOME_PLAN_NOT_FOUND = {
  APPLICATION: HOUSING_APPLICATION_NOT_FOUND.APPLICATION,
  STAFF_APPLICATION: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
  PROVIDER_APPLICATION:
    HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
  HOME_PLAN: "Home plan not found for this application",
} as const;

export const HOME_PLAN_EMPTY_TAB_MESSAGE =
  "This tab becomes active once you're selected as the home plan." as const;

export const HOME_PLAN_BAD_REQUEST = {
  NOT_SENT_TO_PROVIDERS: "Application has not been sent to providers",
  HOME_PLAN_ALREADY_SET:
    "A home plan has already been set for this application",
  PROVIDER_NOT_CONDITIONALLY_APPROVED:
    "Provider must conditionally approve before being accepted as the home plan",
  PROVIDER_NOT_ON_APPLICATION:
    "Provider is not associated with this housing application",
  APPROVALS_NOT_IN_PROGRESS:
    "Approvals can only be recorded during the Approvals stage",
  RELEASE_DECISION_RIDER_ONLY:
    "A release decision can only be recorded for a Rider",
  INVESTIGATION_NOT_APPLICABLE_NOT_ALLOWED:
    "A Rider's home plan investigation must be approved or rejected",
  RELEASE_TASKS_NOT_ACTIVE:
    "Release tasks are only available during the Release stage",
  RELEASE_TASK_NOT_OWNED: "You cannot update this release task",
  RELEASE_TASK_OWNED_BY_PROVIDER:
    "This task can only be completed by the provider",
  RELEASE_TASK_OWNED_BY_STAFF:
    "This task can only be completed by the case manager",
  RELEASE_TASK_NOT_FOUND: "Release task not found for this home plan",
  RELEASE_TASK_DETAIL_REQUIRED:
    "Fill in this task's details before completing it",
  SELECTED_PROVIDER_NOT_ON_APPLICATION:
    "Selected home plan provider is not associated with this application",
} as const;

export function throwHomePlanNotFound(
  message: (typeof HOME_PLAN_NOT_FOUND)[keyof typeof HOME_PLAN_NOT_FOUND],
): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export function throwHomePlanBadRequest(
  message: (typeof HOME_PLAN_BAD_REQUEST)[keyof typeof HOME_PLAN_BAD_REQUEST],
): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function assertHomePlanValid<T>(
  value: T,
  message: (typeof HOME_PLAN_BAD_REQUEST)[keyof typeof HOME_PLAN_BAD_REQUEST],
): asserts value is NonNullable<T> {
  if (value == null) {
    throwHomePlanBadRequest(message);
  }
}

export async function findStaffHomePlan(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<AcceptHomePlanApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      staffApplication: { staffPseudonymizedId },
    },
    select: ACCEPT_HOME_PLAN_APPLICATION_SELECT,
  });
}

export async function findStaffApprovalsHomePlan(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<SetHomePlanApprovalsApplicationRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      staffApplication: { staffPseudonymizedId },
    },
    select: SET_HOME_PLAN_APPROVALS_APPLICATION_SELECT,
  });
}

export function requireStaffApprovalsHomePlan(
  context: SetHomePlanApprovalsApplicationRow | null,
): asserts context is SetHomePlanApprovalsApplicationRowWithStaff {
  if (context == null || context.staffApplication == null) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.STAFF_APPLICATION);
  }
}

export function resolveSetManualAddressHomePlan(
  context: StaffHomePlanViewRowWithStaff,
): void {
  if (context.homePlan != null) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.HOME_PLAN_ALREADY_SET);
  }

  assertStaffCaseModifiable(context.staffApplication.stage);
}

/**
 * Being in the Approvals stage is the only gate: a CM must be able to correct
 * one decision while the case waits on the other. Once the case leaves the
 * stage the decisions are frozen, because the stage no longer matches.
 */
export function resolveSetApprovalsHomePlan(
  context: SetHomePlanApprovalsApplicationRowWithStaff,
  input: Pick<SetApprovalsInput, "releaseDecision" | "homePlanInvestigation">,
): {
  selectedProviderApplicationId: string | null;
  persisted: ApprovalsDecisions;
  isRider: boolean;
} {
  if (context.homePlan == null) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.HOME_PLAN);
  }

  if (context.staffApplication.stage !== ApplicationStage.APPROVALS) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.APPROVALS_NOT_IN_PROGRESS);
  }

  const isRider = isRiderFormData(context.formData);

  if (!isRider && input.releaseDecision != null) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.RELEASE_DECISION_RIDER_ONLY);
  }

  if (
    isRider &&
    input.homePlanInvestigation === HomePlanInvestigationResult.NOT_APPLICABLE
  ) {
    throwHomePlanBadRequest(
      HOME_PLAN_BAD_REQUEST.INVESTIGATION_NOT_APPLICABLE_NOT_ALLOWED,
    );
  }

  const persisted: ApprovalsDecisions = {
    paroleCommissionDecision: context.staffApplication.paroleCommissionDecision,
    releaseDecision: context.homePlan.releaseDecision,
    homePlanInvestigation: context.homePlan.homePlanInvestigation,
  };

  const selectedProviderId = context.homePlan.selectedProviderId;
  if (selectedProviderId == null) {
    return { selectedProviderApplicationId: null, persisted, isRider };
  }

  const selectedProviderApplication = context.providerApplications.find(
    (row) => row.providerId === selectedProviderId,
  );
  assertHomePlanValid(
    selectedProviderApplication,
    HOME_PLAN_BAD_REQUEST.SELECTED_PROVIDER_NOT_ON_APPLICATION,
  );

  return {
    selectedProviderApplicationId: selectedProviderApplication.id,
    persisted,
    isRider,
  };
}

type ToggleReleaseTaskHomePlanData = {
  staffApplication: { stage: ApplicationStage };
  homePlan: HomePlanRow | null;
  providerApplications: Array<{ id: string; providerId: string }>;
};

export async function findStaffToggleReleaseTask(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<StaffToggleReleaseTaskRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      staffApplication: { staffPseudonymizedId },
    },
    select: STAFF_TOGGLE_RELEASE_TASK_APPLICATION_SELECT,
  });
}

/** `providerId` is the verified active organization — never the person. */
export async function findProviderToggleReleaseTask(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderToggleReleaseTaskRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: providerToggleReleaseTaskApplicationSelect(providerId),
  });
}

export function requireStaffToggleReleaseTask(
  context: StaffToggleReleaseTaskRow | null,
): asserts context is StaffToggleReleaseTaskRowWithStaff {
  if (context == null || context.staffApplication == null) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.STAFF_APPLICATION);
  }
}

export function requireProviderToggleReleaseTask(
  context: ProviderToggleReleaseTaskRow | null,
  providerId: string,
): asserts context is ProviderToggleReleaseTaskRowWithStaff {
  if (
    context == null ||
    context.providerApplications.length === 0 ||
    context.staffApplication == null ||
    context.homePlan == null
  ) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.PROVIDER_APPLICATION);
  }

  if (context.homePlan.selectedProviderId !== providerId) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.RELEASE_TASK_NOT_OWNED);
  }
}

function findSelectedProviderApplicationId(
  context: ToggleReleaseTaskHomePlanData,
): string | null {
  const selectedProviderId = context.homePlan?.selectedProviderId;
  if (selectedProviderId == null) {
    return null;
  }

  return (
    context.providerApplications.find(
      (row) => row.providerId === selectedProviderId,
    )?.id ?? null
  );
}

function isTaskOwnedByActorRole(
  taskType: ReleaseTaskType,
  actorRole: TaskCompletedByRole,
): boolean {
  const requiredRole = RELEASE_TASK_DEFS[taskType].ownerRole;
  const actorOwnerRole =
    actorRole === TaskCompletedByRole.STAFF
      ? ReleaseTaskOwnerRole.STAFF
      : ReleaseTaskOwnerRole.PROVIDER;

  return requiredRole === actorOwnerRole;
}

export function resolveToggleReleaseTaskHomePlan(
  context: ToggleReleaseTaskHomePlanData,
  actor: ToggleReleaseTaskActor,
  taskType: ReleaseTaskType,
): ToggleReleaseTaskTarget {
  if (context.homePlan == null) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.HOME_PLAN);
  }

  if (context.staffApplication.stage !== ApplicationStage.RELEASE) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.RELEASE_TASKS_NOT_ACTIVE);
  }

  const isManualAddressPlan =
    context.homePlan.type === HomePlanType.MANUAL_ADDRESS;
  const staffCanActOnAnyTask =
    actor.role === TaskCompletedByRole.STAFF && isManualAddressPlan;

  if (!staffCanActOnAnyTask && !isTaskOwnedByActorRole(taskType, actor.role)) {
    throwHomePlanBadRequest(
      RELEASE_TASK_DEFS[taskType].ownerRole === ReleaseTaskOwnerRole.PROVIDER
        ? HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_PROVIDER
        : HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_STAFF,
    );
  }

  if (
    actor.role === TaskCompletedByRole.PROVIDER &&
    context.homePlan.selectedProviderId !== actor.providerId
  ) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.RELEASE_TASK_NOT_OWNED);
  }

  const task = context.homePlan.releaseTasks.find(
    (row) => row.taskType === taskType,
  );
  assertHomePlanValid(task, HOME_PLAN_BAD_REQUEST.RELEASE_TASK_NOT_FOUND);

  return {
    taskId: task.id,
    selectedProviderApplicationId: findSelectedProviderApplicationId(context),
    releaseTasks: context.homePlan.releaseTasks,
    isManualAddressPlan,
  };
}

/** Completing a task whose required detail is empty is refused; unchecking never is. */
export function requireReleaseTaskDetailForCompletion(
  target: ToggleReleaseTaskTarget,
  taskType: ActiveReleaseTaskType,
  completed: boolean,
): void {
  const task = target.releaseTasks.find((row) => row.id === target.taskId);
  if (completed && isRequiredReleaseTaskDetailMissing(taskType, task)) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.RELEASE_TASK_DETAIL_REQUIRED);
  }
}

export async function findStaffHomePlanView(
  client: DbClient,
  applicationId: string,
  staffPseudonymizedId: string,
): Promise<StaffHomePlanViewRow | null> {
  return client.housingApplication.findFirst({
    where: {
      id: applicationId,
      staffApplication: { staffPseudonymizedId },
    },
    select: STAFF_HOME_PLAN_APPLICATION_SELECT,
  });
}

/** `providerId` is the verified active organization — never the person. */
export async function findProviderHomePlanView(
  client: DbClient,
  applicationId: string,
  providerId: string,
): Promise<ProviderHomePlanViewRow | null> {
  return client.housingApplication.findFirst({
    where: buildApplicationWhereForProvider(applicationId, providerId),
    select: providerHomePlanApplicationSelect(providerId),
  });
}

export function requireStaffHomePlanView(
  context: StaffHomePlanViewRow | null,
): asserts context is StaffHomePlanViewRowWithStaff {
  if (context == null || context.staffApplication == null) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.STAFF_APPLICATION);
  }
}

export function requireProviderHomePlanView(
  context: ProviderHomePlanViewRow | null,
): asserts context is ProviderHomePlanViewRowWithStaff {
  if (
    context == null ||
    context.providerApplications.length === 0 ||
    context.staffApplication == null
  ) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.PROVIDER_APPLICATION);
  }
}

export async function findHomePlanByApplicationId(
  client: DbClient,
  applicationId: string,
): Promise<HomePlanRow | null> {
  return client.housingApplicationHomePlan.findUnique({
    where: { applicationId },
    select: HOME_PLAN_SELECT,
  });
}

export function requireStaffAcceptHomePlan(
  context: AcceptHomePlanApplicationRow | null,
): asserts context is AcceptHomePlanApplicationRowWithStaff {
  if (context == null || context.staffApplication == null) {
    throwHomePlanNotFound(HOME_PLAN_NOT_FOUND.STAFF_APPLICATION);
  }
}

export function resolveAcceptProviderHomePlanTarget(
  context: AcceptHomePlanApplicationRowWithStaff,
  providerId: string,
): AcceptProviderHomePlanTarget {
  if (context.sentToProvidersAt == null) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.NOT_SENT_TO_PROVIDERS);
  }

  if (context.homePlan != null) {
    throwHomePlanBadRequest(HOME_PLAN_BAD_REQUEST.HOME_PLAN_ALREADY_SET);
  }

  assertStaffCaseModifiable(context.staffApplication.stage);

  const providerApplication = context.providerApplications.find(
    (row) => row.providerId === providerId,
  );
  assertHomePlanValid(
    providerApplication,
    HOME_PLAN_BAD_REQUEST.PROVIDER_NOT_ON_APPLICATION,
  );

  if (
    providerApplication.subStage !== ApplicationSubStage.CONDITIONALLY_APPROVED
  ) {
    throwHomePlanBadRequest(
      HOME_PLAN_BAD_REQUEST.PROVIDER_NOT_CONDITIONALLY_APPROVED,
    );
  }

  return {
    providerId,
    providerName: providerApplication.provider.name,
    selectedProviderApplicationId: providerApplication.id,
  };
}
