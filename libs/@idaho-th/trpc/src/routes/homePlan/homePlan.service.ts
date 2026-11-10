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
  AlertType,
  ApplicationStage,
  ApplicationSubStage,
  type Prisma,
  type PrismaClient,
  ReleaseTaskType,
  TaskCompletedByRole,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  deriveApprovalsOutcome,
  isRequiredReleaseTaskDetailMissing,
} from "~@idaho-th/shared";
import { createAlerts } from "~@idaho-th/trpc/routes/alert/alert.helpers";
import {
  HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  lockHousingApplicationForUpdate,
} from "~@idaho-th/trpc/routes/housing-common/housingApplication.helpers";
import {
  recordTimelineEvent,
  withTimelineAnalytics,
} from "~@idaho-th/trpc/routes/timeline/timeline.events";

import {
  findProviderHomePlanView,
  findProviderToggleReleaseTask,
  findStaffApprovalsHomePlan,
  findStaffHomePlan,
  findStaffHomePlanView,
  findStaffToggleReleaseTask,
  requireProviderHomePlanView,
  requireProviderToggleReleaseTask,
  requireReleaseTaskDetailForCompletion,
  requireStaffAcceptHomePlan,
  requireStaffApprovalsHomePlan,
  requireStaffHomePlanView,
  requireStaffToggleReleaseTask,
  resolveAcceptProviderHomePlanTarget,
  resolveSetApprovalsHomePlan,
  resolveSetManualAddressHomePlan,
  resolveToggleReleaseTaskHomePlan,
} from "./homePlan.helpers";
import {
  mapProviderHomePlanEmptyResult,
  mapProviderHomePlanResult,
  mapStaffHomePlanEmptyResult,
  mapStaffHomePlanResult,
} from "./homePlan.mapper";
import {
  buildAcceptHomePlanWriteData,
  buildManualAddressHomePlanWriteData,
  buildSetApprovalsWriteData,
  buildToggleReleaseTaskWriteData,
  buildUpdateReleaseTaskDetailWriteData,
  MANUAL_ADDRESS_CLOSED_SUB_STAGE,
  mergeApprovalsDecisions,
  resolveClosedProviderSubStage,
} from "./homePlan.progression";
import { HOME_PLAN_SELECT } from "./homePlan.selects";
import type {
  AcceptProviderInput,
  GetHomePlanInput,
  GetHomePlanResult,
  HomePlanTransactionClient,
  PersistHomePlanMutationViewer,
  SetApprovalsInput,
  SetManualAddressInput,
  ToggleReleaseTaskActor,
  ToggleReleaseTaskCaller,
  ToggleReleaseTaskInput,
  ToggleReleaseTaskTarget,
  UpdateReleaseTaskDetailInput,
} from "./homePlan.types";

const HOME_PLAN_MUTATION_RESULT_SELECT = {
  sentToProvidersAt: true,
  staffApplication: { select: { stage: true, paroleCommissionDecision: true } },
  homePlan: { select: HOME_PLAN_SELECT },
} as const;

async function persistHomePlanMutation(
  tx: HomePlanTransactionClient,
  applicationId: string,
  data: Prisma.HousingApplicationUpdateInput,
  viewer: PersistHomePlanMutationViewer,
): Promise<GetHomePlanResult> {
  const updatedApplication = await tx.housingApplication.update({
    where: { id: applicationId },
    // lastActivityAt is the canonical "Last Updated" timestamp for the
    // dashboard — bumped here (rather than per recordTimelineEvent call) to
    // avoid extra round-trips when a mutation records multiple events.
    data: { ...data, lastActivityAt: new Date() },
    select: HOME_PLAN_MUTATION_RESULT_SELECT,
  });

  const homePlan = updatedApplication.homePlan;
  const staffApplication = updatedApplication.staffApplication;

  if (homePlan == null || staffApplication == null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to persist home plan",
    });
  }

  const { stage, paroleCommissionDecision } = staffApplication;

  if (viewer.role === TaskCompletedByRole.PROVIDER) {
    return mapProviderHomePlanResult(
      applicationId,
      stage,
      homePlan,
      paroleCommissionDecision,
    );
  }

  return mapStaffHomePlanResult(
    applicationId,
    stage,
    homePlan,
    viewer.sentToProvidersAt ?? updatedApplication.sentToProvidersAt,
    paroleCommissionDecision,
  );
}

export async function getStaffHomePlan(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: GetHomePlanInput,
): Promise<GetHomePlanResult> {
  const context = await findStaffHomePlanView(
    prisma,
    input.applicationId,
    staffPseudonymizedId,
  );
  requireStaffHomePlanView(context);

  const stage = context.staffApplication.stage;

  if (context.homePlan == null) {
    return mapStaffHomePlanEmptyResult(
      context.id,
      stage,
      context.sentToProvidersAt,
    );
  }

  return mapStaffHomePlanResult(
    context.id,
    stage,
    context.homePlan,
    context.sentToProvidersAt,
    context.staffApplication.paroleCommissionDecision,
  );
}

/** Scoped to the organization the caller is acting as, not to the person. */
export async function getProviderHomePlan(
  prisma: PrismaClient,
  activeProviderId: string,
  input: GetHomePlanInput,
): Promise<GetHomePlanResult> {
  const context = await findProviderHomePlanView(
    prisma,
    input.applicationId,
    activeProviderId,
  );
  requireProviderHomePlanView(context);

  const stage = context.staffApplication.stage;
  const isSelectedHomePlanProvider =
    context.homePlan?.selectedProviderId === activeProviderId;

  if (!isSelectedHomePlanProvider || context.homePlan == null) {
    return mapProviderHomePlanEmptyResult(context.id, stage);
  }

  return mapProviderHomePlanResult(
    context.id,
    stage,
    context.homePlan,
    context.staffApplication.paroleCommissionDecision,
  );
}

async function recordNotSelectedProviderTimelineEvents(
  tx: HomePlanTransactionClient,
  applicationId: string,
  providerApplications: Array<{
    providerId: string;
    subStage: ApplicationSubStage;
  }>,
  excludedProviderId: string | null,
): Promise<void> {
  // Providers that declined or revoked already have their own closing event.
  const notSelectedProviders = providerApplications.filter(
    (row) =>
      row.providerId !== excludedProviderId &&
      row.subStage !== ApplicationSubStage.DECLINED &&
      row.subStage !== ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
  );

  await Promise.all(
    notSelectedProviders.map((row) =>
      recordTimelineEvent(tx, {
        applicationId,
        actor: { role: TimelineActorRole.SYSTEM },
        scopedProviderId: row.providerId,
        type:
          resolveClosedProviderSubStage(row.subStage) ===
          ApplicationSubStage.NOT_SELECTED
            ? TimelineEventType.PROVIDER_NOT_SELECTED
            : TimelineEventType.PROVIDER_CANCELED,
      }),
    ),
  );
}

async function recordStageAdvancedTimelineEvent(
  tx: HomePlanTransactionClient,
  applicationId: string,
  fromStage: ApplicationStage,
  toStage: ApplicationStage,
): Promise<void> {
  await recordTimelineEvent(tx, {
    applicationId,
    actor: { role: TimelineActorRole.SYSTEM },
    type: TimelineEventType.STAGE_ADVANCED,
    fromStage,
    toStage,
  });
}

export async function acceptProviderAsHomePlan(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: AcceptProviderInput,
): Promise<GetHomePlanResult> {
  const { applicationId, providerId } = input;

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const housingApplicationWithHomePlan = await findStaffHomePlan(
        tx,
        applicationId,
        staffPseudonymizedId,
      );
      requireStaffAcceptHomePlan(housingApplicationWithHomePlan);

      const target = resolveAcceptProviderHomePlanTarget(
        housingApplicationWithHomePlan,
        providerId,
      );

      const homePlanResult = await persistHomePlanMutation(
        tx,
        applicationId,
        buildAcceptHomePlanWriteData(
          target.providerId,
          target.selectedProviderApplicationId,
          staffPseudonymizedId,
          housingApplicationWithHomePlan.providerApplications,
          housingApplicationWithHomePlan.staffApplication
            .paroleCommissionDecision,
        ),
        {
          role: TaskCompletedByRole.STAFF,
          sentToProvidersAt: housingApplicationWithHomePlan.sentToProvidersAt,
        },
      );

      await recordTimelineEvent(tx, {
        applicationId,
        actor: {
          role: TimelineActorRole.STAFF,
          pseudonymizedId: staffPseudonymizedId,
        },
        scopedProviderId: target.providerId,
        type: TimelineEventType.PROVIDER_SELECTED_AS_HOME_PLAN,
        providerName: target.providerName,
      });

      await createAlerts(tx, {
        type: AlertType.SELECTED_AS_HOME_PLAN,
        applicationId,
        recipients: [{ providerId: target.providerId }],
      });

      await recordNotSelectedProviderTimelineEvents(
        tx,
        applicationId,
        housingApplicationWithHomePlan.providerApplications,
        target.providerId,
      );

      await recordStageAdvancedTimelineEvent(
        tx,
        applicationId,
        ApplicationStage.APPLICATION,
        ApplicationStage.APPROVALS,
      );

      return homePlanResult;
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

export async function setManualAddressHomePlan(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: SetManualAddressInput,
): Promise<GetHomePlanResult> {
  const { applicationId, address } = input;

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const context = await findStaffHomePlanView(
        tx,
        applicationId,
        staffPseudonymizedId,
      );
      requireStaffHomePlanView(context);

      resolveSetManualAddressHomePlan(context);

      // Recorded before the write: setting an address closes the case, and the
      // timeline rejects everything but CASE_CLOSED once the case is closed.
      await recordTimelineEvent(tx, {
        applicationId,
        actor: {
          role: TimelineActorRole.STAFF,
          pseudonymizedId: staffPseudonymizedId,
        },
        cmOnly: true,
        type: TimelineEventType.HOME_PLAN_ADDRESS_SET,
        streetAddress: address,
      });

      await recordNotSelectedProviderTimelineEvents(
        tx,
        applicationId,
        context.providerApplications,
        null,
      );

      const homePlanResult = await persistHomePlanMutation(
        tx,
        applicationId,
        buildManualAddressHomePlanWriteData(
          address,
          staffPseudonymizedId,
          context.providerApplications,
        ),
        {
          role: TaskCompletedByRole.STAFF,
          sentToProvidersAt: context.sentToProvidersAt,
        },
      );

      await recordTimelineEvent(tx, {
        applicationId,
        actor: { role: TimelineActorRole.SYSTEM },
        type: TimelineEventType.CASE_CLOSED,
        closedSubStage: MANUAL_ADDRESS_CLOSED_SUB_STAGE,
      });

      return homePlanResult;
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

export async function setHomePlanApprovals(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: SetApprovalsInput,
): Promise<GetHomePlanResult> {
  const { applicationId, releaseDecision, homePlanInvestigation } = input;

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const context = await findStaffApprovalsHomePlan(
        tx,
        applicationId,
        staffPseudonymizedId,
      );
      requireStaffApprovalsHomePlan(context);

      const { selectedProviderApplicationId, persisted, isRider } =
        resolveSetApprovalsHomePlan(context, input);

      const decisions = mergeApprovalsDecisions(persisted, {
        releaseDecision,
        homePlanInvestigation,
      });
      const outcome = deriveApprovalsOutcome({
        ...decisions,
        isRider,
        hasHomePlan: true,
      });

      const homePlanResult = await persistHomePlanMutation(
        tx,
        applicationId,
        buildSetApprovalsWriteData(
          decisions,
          outcome,
          staffPseudonymizedId,
          selectedProviderApplicationId,
        ),
        {
          role: TaskCompletedByRole.STAFF,
          sentToProvidersAt: context.sentToProvidersAt,
        },
      );

      // A partial save leaves the case in Approvals and records nothing on the
      // timeline; only the terminal outcome is worth a history entry.
      if (outcome.type === "WAIT") {
        return homePlanResult;
      }

      await recordTimelineEvent(tx, {
        applicationId,
        actor: {
          role: TimelineActorRole.STAFF,
          pseudonymizedId: staffPseudonymizedId,
        },
        type:
          outcome.type === "ADVANCE"
            ? TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED
            : TimelineEventType.APPROVALS_HOUSING_PLAN_REJECTED,
      });

      if (outcome.type === "ADVANCE") {
        await recordStageAdvancedTimelineEvent(
          tx,
          applicationId,
          ApplicationStage.APPROVALS,
          ApplicationStage.RELEASE,
        );
      } else {
        await recordTimelineEvent(tx, {
          applicationId,
          actor: { role: TimelineActorRole.SYSTEM },
          type: TimelineEventType.CASE_CLOSED,
          closedSubStage: ApplicationSubStage.PLAN_REJECTED,
        });
      }

      return homePlanResult;
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

async function recordReleaseTaskTimelineEvent(
  tx: HomePlanTransactionClient,
  applicationId: string,
  caller: ToggleReleaseTaskCaller,
  taskType: ReleaseTaskType,
  completed: boolean,
): Promise<void> {
  const role =
    caller.role === TaskCompletedByRole.STAFF
      ? TimelineActorRole.STAFF
      : TimelineActorRole.PROVIDER;

  await recordTimelineEvent(tx, {
    applicationId,
    actor: { role, pseudonymizedId: caller.pseudonymizedId },
    type: TimelineEventType.RELEASE_TASK_UPDATED,
    releaseTaskType: taskType,
    completed,
  });
}

export async function toggleHomePlanReleaseTask(
  prisma: PrismaClient,
  caller: ToggleReleaseTaskCaller,
  input: ToggleReleaseTaskInput,
): Promise<GetHomePlanResult> {
  const { applicationId, taskType, completed } = input;

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      if (caller.role === TaskCompletedByRole.STAFF) {
        const context = await findStaffToggleReleaseTask(
          tx,
          applicationId,
          caller.pseudonymizedId,
        );
        requireStaffToggleReleaseTask(context);

        const staffActor: ToggleReleaseTaskActor = {
          role: TaskCompletedByRole.STAFF,
          pseudonymizedId: caller.pseudonymizedId,
        };
        const staffTarget = resolveToggleReleaseTaskHomePlan(
          context,
          staffActor,
          taskType,
        );
        requireReleaseTaskDetailForCompletion(staffTarget, taskType, completed);
        const {
          taskId,
          selectedProviderApplicationId,
          releaseTasks,
          isManualAddressPlan,
        } = staffTarget;

        const staffResult = await persistHomePlanMutation(
          tx,
          applicationId,
          buildToggleReleaseTaskWriteData({
            releaseTasks,
            taskId,
            taskType,
            completed,
            completedByRole: staffActor.role,
            completedByPseudonymizedId: caller.pseudonymizedId,
            selectedProviderApplicationId,
            isManualAddressPlan,
          }),
          {
            role: TaskCompletedByRole.STAFF,
            sentToProvidersAt: context.sentToProvidersAt,
          },
        );

        await recordReleaseTaskTimelineEvent(
          tx,
          applicationId,
          caller,
          taskType,
          completed,
        );

        return staffResult;
      }

      // The read is scoped to the organization; the write is attributed to the
      // person. Both come off the same caller and must not be swapped.
      const context = await findProviderToggleReleaseTask(
        tx,
        applicationId,
        caller.providerId,
      );
      requireProviderToggleReleaseTask(context, caller.providerId);
      const providerActor: ToggleReleaseTaskActor = {
        role: TaskCompletedByRole.PROVIDER,
        pseudonymizedId: caller.pseudonymizedId,
        providerId: caller.providerId,
      };
      const providerTarget = resolveToggleReleaseTaskHomePlan(
        context,
        providerActor,
        taskType,
      );
      requireReleaseTaskDetailForCompletion(
        providerTarget,
        taskType,
        completed,
      );
      const {
        taskId,
        selectedProviderApplicationId,
        releaseTasks,
        isManualAddressPlan,
      } = providerTarget;

      const providerResult = await persistHomePlanMutation(
        tx,
        applicationId,
        buildToggleReleaseTaskWriteData({
          releaseTasks,
          taskId,
          taskType,
          completed,
          completedByRole: providerActor.role,
          completedByPseudonymizedId: caller.pseudonymizedId,
          selectedProviderApplicationId,
          isManualAddressPlan,
        }),
        { role: TaskCompletedByRole.PROVIDER },
      );

      await recordReleaseTaskTimelineEvent(
        tx,
        applicationId,
        caller,
        taskType,
        completed,
      );

      return providerResult;
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

export async function toggleStaffHomePlanReleaseTask(
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: ToggleReleaseTaskInput,
): Promise<GetHomePlanResult> {
  return toggleHomePlanReleaseTask(
    prisma,
    { role: TaskCompletedByRole.STAFF, pseudonymizedId: staffPseudonymizedId },
    input,
  );
}

/**
 * `activeProviderId` scopes the read to the organization the caller is acting
 * as; `providerPseudonymizedId` is the colleague recorded as having completed
 * the task.
 */
export async function toggleProviderHomePlanReleaseTask(
  prisma: PrismaClient,
  actor: { activeProviderId: string; providerPseudonymizedId: string },
  input: ToggleReleaseTaskInput,
): Promise<GetHomePlanResult> {
  return toggleHomePlanReleaseTask(
    prisma,
    {
      role: TaskCompletedByRole.PROVIDER,
      pseudonymizedId: actor.providerPseudonymizedId,
      providerId: actor.activeProviderId,
    },
    input,
  );
}

async function resolveReleaseTaskDetailTarget(
  tx: HomePlanTransactionClient,
  applicationId: string,
  caller: ToggleReleaseTaskCaller,
  taskType: UpdateReleaseTaskDetailInput["taskType"],
): Promise<{
  target: ToggleReleaseTaskTarget;
  viewer: PersistHomePlanMutationViewer;
}> {
  if (caller.role === TaskCompletedByRole.STAFF) {
    const context = await findStaffToggleReleaseTask(
      tx,
      applicationId,
      caller.pseudonymizedId,
    );
    requireStaffToggleReleaseTask(context);

    return {
      target: resolveToggleReleaseTaskHomePlan(context, caller, taskType),
      viewer: {
        role: TaskCompletedByRole.STAFF,
        sentToProvidersAt: context.sentToProvidersAt,
      },
    };
  }

  const context = await findProviderToggleReleaseTask(
    tx,
    applicationId,
    caller.providerId,
  );
  requireProviderToggleReleaseTask(context, caller.providerId);

  return {
    target: resolveToggleReleaseTaskHomePlan(context, caller, taskType),
    viewer: { role: TaskCompletedByRole.PROVIDER },
  };
}

export async function updateHomePlanReleaseTaskDetail(
  prisma: PrismaClient,
  caller: ToggleReleaseTaskCaller,
  input: UpdateReleaseTaskDetailInput,
): Promise<GetHomePlanResult> {
  const { applicationId, taskType } = input;
  const detail =
    input.type === "text" ? { note: input.note } : { date: input.date };

  return withTimelineAnalytics(
    prisma,
    async (tx) => {
      await lockHousingApplicationForUpdate(tx, applicationId);

      const { target, viewer } = await resolveReleaseTaskDetailTarget(
        tx,
        applicationId,
        caller,
        taskType,
      );

      // Timeline events are intentionally disabled for detail saves: notes
      // autosave on a debounce, so every pause in typing would create an event.
      const detailResult = await persistHomePlanMutation(
        tx,
        applicationId,
        buildUpdateReleaseTaskDetailWriteData({
          taskId: target.taskId,
          detail,
        }),
        viewer,
      );

      // A completed task never lacks a required detail: clearing it unchecks
      // the task exactly as a manual uncheck would, timeline entry included.
      const task = target.releaseTasks.find((row) => row.id === target.taskId);
      if (
        !task?.completed ||
        !isRequiredReleaseTaskDetailMissing(taskType, detail)
      ) {
        return detailResult;
      }

      const uncheckResult = await persistHomePlanMutation(
        tx,
        applicationId,
        buildToggleReleaseTaskWriteData({
          releaseTasks: target.releaseTasks,
          taskId: target.taskId,
          taskType,
          completed: false,
          completedByRole: caller.role,
          completedByPseudonymizedId: caller.pseudonymizedId,
          selectedProviderApplicationId: target.selectedProviderApplicationId,
          isManualAddressPlan: target.isManualAddressPlan,
        }),
        viewer,
      );
      await recordReleaseTaskTimelineEvent(
        tx,
        applicationId,
        caller,
        taskType,
        false,
      );

      return uncheckResult;
    },
    HOUSING_APPLICATION_LOCK_TRANSACTION_OPTIONS,
  );
}

export const updateStaffHomePlanReleaseTaskDetail = (
  prisma: PrismaClient,
  staffPseudonymizedId: string,
  input: UpdateReleaseTaskDetailInput,
) =>
  updateHomePlanReleaseTaskDetail(
    prisma,
    { role: TaskCompletedByRole.STAFF, pseudonymizedId: staffPseudonymizedId },
    input,
  );

export const updateProviderHomePlanReleaseTaskDetail = (
  prisma: PrismaClient,
  actor: { activeProviderId: string; providerPseudonymizedId: string },
  input: UpdateReleaseTaskDetailInput,
) =>
  updateHomePlanReleaseTaskDetail(
    prisma,
    {
      role: TaskCompletedByRole.PROVIDER,
      pseudonymizedId: actor.providerPseudonymizedId,
      providerId: actor.activeProviderId,
    },
    input,
  );
