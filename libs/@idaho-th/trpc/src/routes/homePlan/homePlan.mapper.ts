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

import {
  ApplicationStage,
  HomePlanInvestigationResult,
  ParoleCommissionDecision,
  ReleaseDecision,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";
import {
  HomePlanApprovalsBadge,
  ORDERED_RELEASE_TASK_TYPES,
} from "~@idaho-th/shared";
import { toHousingProviderContact } from "~@idaho-th/trpc/routes/housing-common/housingProviderContact";

import { HOME_PLAN_EMPTY_TAB_MESSAGE } from "./homePlan.helpers";
import type {
  GetHomePlanResult,
  HomePlanApprovalsView,
  HomePlanPermissions,
  HomePlanRow,
  HomePlanView,
} from "./homePlan.types";

// Only one release-side decision is ever set: the Parole Commission's for a
// Termer/PV, the court's for a Rider. Neither needs the cohort to read.
function resolveApprovalsBadge(
  stage: ApplicationStage,
  homePlan: HomePlanRow,
  paroleCommissionDecision: ParoleCommissionDecision | null,
): HomePlanApprovalsBadge | null {
  if (stage === ApplicationStage.APPROVALS && homePlan.approvalsAt == null) {
    return HomePlanApprovalsBadge.PENDING;
  }

  if (
    homePlan.releaseDecision === ReleaseDecision.PROBATION_DENIED ||
    paroleCommissionDecision === ParoleCommissionDecision.PAROLE_DENIED
  ) {
    return HomePlanApprovalsBadge.RELEASE_DENIED;
  }

  if (homePlan.homePlanInvestigation === HomePlanInvestigationResult.REJECTED) {
    return HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED;
  }

  // Historical cases predating the split carry null in both columns; claiming
  // an approval they never recorded would be worse than showing no badge.
  if (
    (paroleCommissionDecision ?? homePlan.releaseDecision) == null ||
    homePlan.homePlanInvestigation == null
  ) {
    return HomePlanApprovalsBadge.PENDING;
  }

  return HomePlanApprovalsBadge.HOUSING_PLAN_APPROVED;
}

function mapStaffApprovalsView(
  stage: ApplicationStage,
  homePlan: HomePlanRow,
  paroleCommissionDecision: ParoleCommissionDecision | null,
): HomePlanApprovalsView {
  return {
    badge: resolveApprovalsBadge(stage, homePlan, paroleCommissionDecision),
    releaseDecision: homePlan.releaseDecision,
    homePlanInvestigation: homePlan.homePlanInvestigation,
    approvalsAt: homePlan.approvalsAt,
  };
}

// Providers learn the outcome, never the CM's individual decisions.
function mapProviderApprovalsView(
  stage: ApplicationStage,
  homePlan: HomePlanRow,
  paroleCommissionDecision: ParoleCommissionDecision | null,
): HomePlanApprovalsView {
  const badge = resolveApprovalsBadge(
    stage,
    homePlan,
    paroleCommissionDecision,
  );

  return {
    // A denied release is a private close reason; providers see a rejected plan.
    badge:
      badge === HomePlanApprovalsBadge.RELEASE_DENIED
        ? HomePlanApprovalsBadge.HOUSING_PLAN_REJECTED
        : badge,
    releaseDecision: null,
    homePlanInvestigation: null,
    approvalsAt: null,
  };
}

function mapHomePlanView(
  homePlan: HomePlanRow,
  audience: TaskCompletedByRole,
): HomePlanView {
  return {
    type: homePlan.type,
    address: homePlan.address,
    provider: homePlan.selectedProvider
      ? {
          providerId: homePlan.selectedProvider.id,
          name: homePlan.selectedProvider.name,
          // Staff only: the selected organization need not be the viewing
          // provider's own, so its contact person is not theirs to see.
          contact:
            audience === TaskCompletedByRole.STAFF
              ? toHousingProviderContact(homePlan.selectedProvider)
              : null,
          status: "ACCEPTED_AS_HOME_PLAN",
        }
      : null,
    createdAt: homePlan.createdAt,
    updatedAt: homePlan.updatedAt,
  };
}

function mapReleaseTasks(
  stage: ApplicationStage,
  homePlan: HomePlanRow,
  viewerRole: TaskCompletedByRole,
) {
  const otherPartyRole =
    viewerRole === TaskCompletedByRole.STAFF
      ? TaskCompletedByRole.PROVIDER
      : TaskCompletedByRole.STAFF;

  const tasksByType = new Map(
    homePlan.releaseTasks.map((task) => [task.taskType, task]),
  );
  const tasks = ORDERED_RELEASE_TASK_TYPES.map((taskType) => {
    const task = tasksByType.get(taskType);
    const completed = task?.completed ?? false;

    return {
      taskType,
      completed,
      completedAt: task?.completedAt ?? null,
      completedByRole: task?.completedByRole ?? null,
      updatedByOtherParty:
        completed && task?.completedByRole === otherPartyRole,
      note: task?.note ?? null,
      date: task?.date ?? null,
    };
  });

  return {
    active: stage === ApplicationStage.RELEASE,
    completedCount: tasks.filter((task) => task.completed).length,
    totalCount: ORDERED_RELEASE_TASK_TYPES.length,
    tasks,
  };
}

function buildStaffPermissions(
  stage: ApplicationStage,
  homePlan: HomePlanRow | null,
  sentToProvidersAt: Date | null,
): HomePlanPermissions {
  if (homePlan == null) {
    return {
      canSetHomePlan:
        stage !== ApplicationStage.CLOSED && sentToProvidersAt != null,
      canSetApprovals: false,
      canToggleReleaseTasks: false,
      isSelectedProvider: false,
    };
  }

  return {
    canSetHomePlan: false,
    canSetApprovals: stage === ApplicationStage.APPROVALS,
    canToggleReleaseTasks: stage === ApplicationStage.RELEASE,
    isSelectedProvider: false,
  };
}

function buildProviderPermissions(
  stage: ApplicationStage,
): HomePlanPermissions {
  return {
    canSetHomePlan: false,
    canSetApprovals: false,
    canToggleReleaseTasks: stage === ApplicationStage.RELEASE,
    isSelectedProvider: true,
  };
}

export function mapStaffHomePlanEmptyResult(
  applicationId: string,
  stage: ApplicationStage,
  sentToProvidersAt: Date | null,
): GetHomePlanResult {
  return {
    applicationId,
    stage,
    homePlan: null,
    approvals: null,
    releaseTasks: null,
    permissions: buildStaffPermissions(stage, null, sentToProvidersAt),
    emptyTabMessage: null,
  };
}

export function mapStaffHomePlanResult(
  applicationId: string,
  stage: ApplicationStage,
  homePlan: HomePlanRow,
  sentToProvidersAt: Date | null,
  paroleCommissionDecision: ParoleCommissionDecision | null = null,
): GetHomePlanResult {
  return {
    applicationId,
    stage,
    homePlan: mapHomePlanView(homePlan, TaskCompletedByRole.STAFF),
    approvals: mapStaffApprovalsView(stage, homePlan, paroleCommissionDecision),
    releaseTasks: mapReleaseTasks(stage, homePlan, TaskCompletedByRole.STAFF),
    permissions: buildStaffPermissions(stage, homePlan, sentToProvidersAt),
    emptyTabMessage: null,
  };
}

export function mapProviderHomePlanEmptyResult(
  applicationId: string,
  stage: ApplicationStage,
): GetHomePlanResult {
  return {
    applicationId,
    stage,
    homePlan: null,
    approvals: null,
    releaseTasks: null,
    permissions: {
      canSetHomePlan: false,
      canSetApprovals: false,
      canToggleReleaseTasks: false,
      isSelectedProvider: false,
    },
    emptyTabMessage: HOME_PLAN_EMPTY_TAB_MESSAGE,
  };
}

export function mapProviderHomePlanResult(
  applicationId: string,
  stage: ApplicationStage,
  homePlan: HomePlanRow,
  paroleCommissionDecision: ParoleCommissionDecision | null = null,
): GetHomePlanResult {
  return {
    applicationId,
    stage,
    homePlan: mapHomePlanView(homePlan, TaskCompletedByRole.PROVIDER),
    approvals: mapProviderApprovalsView(
      stage,
      homePlan,
      paroleCommissionDecision,
    ),
    releaseTasks: mapReleaseTasks(
      stage,
      homePlan,
      TaskCompletedByRole.PROVIDER,
    ),
    permissions: buildProviderPermissions(stage),
    emptyTabMessage: null,
  };
}
