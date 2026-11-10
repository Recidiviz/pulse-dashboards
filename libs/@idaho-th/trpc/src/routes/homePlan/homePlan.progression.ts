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
  ApplicationStatus,
  ApplicationSubStage,
  HomePlanType,
  ParoleCommissionDecision,
  type Prisma,
  ReleaseTaskType,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";
import type {
  ActiveReleaseTaskType,
  ApprovalsOutcome,
} from "~@idaho-th/shared";
import {
  ORDERED_RELEASE_TASK_TYPES,
  RELEASE_TASK_DEFS,
  ReleaseTaskOwnerRole,
} from "~@idaho-th/shared";

import type {
  AcceptHomePlanProviderUpdate,
  AcceptHomePlanStaffUpdate,
  ApprovalsDecisions,
  ReleaseStageStatuses,
  ReleaseTaskCompletionState,
} from "./homePlan.types";

export function buildInitialReleaseTaskRows() {
  return ORDERED_RELEASE_TASK_TYPES.map((taskType) => ({ taskType }));
}

export const ALL_RELEASE_TASKS_INCOMPLETE: ReleaseTaskCompletionState =
  Object.fromEntries(
    ORDERED_RELEASE_TASK_TYPES.map((taskType) => [taskType, false]),
  ) as ReleaseTaskCompletionState;

export function buildReleaseTaskCompletionState(
  releaseTasks: Array<{ taskType: ReleaseTaskType; completed: boolean }>,
  taskType: ActiveReleaseTaskType,
  completed: boolean,
): ReleaseTaskCompletionState {
  const state = ORDERED_RELEASE_TASK_TYPES.reduce<ReleaseTaskCompletionState>(
    (accumulator, type) => {
      const task = releaseTasks.find((row) => row.taskType === type);
      accumulator[type] = task?.completed ?? false;
      return accumulator;
    },
    // Copied, not shared: the reduce mutates its accumulator in place.
    { ...ALL_RELEASE_TASKS_INCOMPLETE },
  );

  state[taskType] = completed;
  return state;
}

function hasIncompleteTaskForRole(
  tasks: ReleaseTaskCompletionState,
  role: ReleaseTaskOwnerRole,
  isManualAddressPlan: boolean,
): boolean {
  if (isManualAddressPlan) {
    return role === ReleaseTaskOwnerRole.STAFF
      ? ORDERED_RELEASE_TASK_TYPES.some((taskType) => !tasks[taskType])
      : false;
  }

  return ORDERED_RELEASE_TASK_TYPES.some(
    (taskType) =>
      RELEASE_TASK_DEFS[taskType].ownerRole === role && !tasks[taskType],
  );
}

function resolveReleaseStageStatus(
  ownIncomplete: boolean,
  otherPartyIncomplete: boolean,
): ApplicationStatus {
  if (ownIncomplete) {
    return ApplicationStatus.ACTION_NEEDED;
  }
  return otherPartyIncomplete
    ? ApplicationStatus.WAITING
    : ApplicationStatus.AWAITING_RELEASE;
}

export function computeReleaseStageStatuses(
  tasks: ReleaseTaskCompletionState,
  isManualAddressPlan = false,
): ReleaseStageStatuses {
  const staffIncomplete = hasIncompleteTaskForRole(
    tasks,
    ReleaseTaskOwnerRole.STAFF,
    isManualAddressPlan,
  );
  const providerIncomplete = hasIncompleteTaskForRole(
    tasks,
    ReleaseTaskOwnerRole.PROVIDER,
    isManualAddressPlan,
  );

  return {
    staffStatus: resolveReleaseStageStatus(staffIncomplete, providerIncomplete),
    selectedProviderStatus: resolveReleaseStageStatus(
      providerIncomplete,
      staffIncomplete,
    ),
  };
}

export function buildToggleReleaseTaskWriteData({
  releaseTasks,
  taskId,
  taskType,
  completed,
  completedByRole,
  completedByPseudonymizedId,
  selectedProviderApplicationId,
  isManualAddressPlan,
}: {
  releaseTasks: Array<{
    id: string;
    taskType: ReleaseTaskType;
    completed: boolean;
  }>;
  taskId: string;
  taskType: ActiveReleaseTaskType;
  completed: boolean;
  completedByRole: TaskCompletedByRole;
  completedByPseudonymizedId: string;
  selectedProviderApplicationId: string | null;
  isManualAddressPlan: boolean;
}): Prisma.HousingApplicationUpdateInput {
  const completionState = buildReleaseTaskCompletionState(
    releaseTasks,
    taskType,
    completed,
  );
  const { staffStatus, selectedProviderStatus } = computeReleaseStageStatuses(
    completionState,
    isManualAddressPlan,
  );

  return {
    homePlan: {
      update: {
        releaseTasks: {
          update: {
            where: { id: taskId },
            data: completed
              ? {
                  completed: true,
                  completedAt: new Date(),
                  completedByRole,
                  completedByPseudonymizedId,
                }
              : {
                  completed: false,
                  completedAt: null,
                  completedByRole: null,
                  completedByPseudonymizedId: null,
                },
          },
        },
      },
    },
    staffApplication: {
      update: {
        status: staffStatus,
      },
    },
    ...(selectedProviderApplicationId == null
      ? {}
      : {
          providerApplications: {
            update: {
              where: { id: selectedProviderApplicationId },
              data: {
                status: selectedProviderStatus,
              },
            },
          },
        }),
  };
}

export function buildUpdateReleaseTaskDetailWriteData({
  taskId,
  detail,
}: {
  taskId: string;
  detail: { note: string | null } | { date: Date | null };
}): Prisma.HousingApplicationUpdateInput {
  // Field by field: the detail never passes client-supplied keys to Prisma.
  const data = "note" in detail ? { note: detail.note } : { date: detail.date };

  return {
    homePlan: {
      update: {
        releaseTasks: {
          update: {
            where: { id: taskId },
            data,
          },
        },
      },
    },
  };
}

type HomePlanProviderApplicationRow = {
  id: string;
  providerId?: string;
  stage: ApplicationStage;
  subStage: ApplicationSubStage;
};

// A provider that was conditionally approved and then passed over is
// NOT_SELECTED; one that revoked keeps CONDITIONAL_APPROVAL_REVOKED, since that
// was its own decision; every other still-open provider (never responded,
// requested info, etc.) is CANCELED. Shared with the timeline-event choice in
// homePlan.service.ts so the two can't drift apart.
export function resolveClosedProviderSubStage(
  subStage: ApplicationSubStage,
):
  | typeof ApplicationSubStage.NOT_SELECTED
  | typeof ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED
  | typeof ApplicationSubStage.CANCELED {
  if (subStage === ApplicationSubStage.CONDITIONALLY_APPROVED) {
    return ApplicationSubStage.NOT_SELECTED;
  }
  if (subStage === ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED) {
    return ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED;
  }
  return ApplicationSubStage.CANCELED;
}

function buildClosedProviderUpdate(subStage: ApplicationSubStage): {
  stage: ApplicationStage;
  subStage: ApplicationSubStage;
  status: ApplicationStatus;
} {
  return {
    stage: ApplicationStage.CLOSED,
    subStage: resolveClosedProviderSubStage(subStage),
    status: ApplicationStatus.DONE,
  };
}

function buildProviderApplicationUpdates(
  providerUpdates: AcceptHomePlanProviderUpdate[],
): Prisma.HousingApplicationUpdateInput["providerApplications"] {
  return {
    update: providerUpdates.map(
      ({ providerApplicationId, stage, subStage, status }) => ({
        where: { id: providerApplicationId },
        data: { stage, subStage, status },
      }),
    ),
  };
}

export function computeApprovalsWaitStatus(
  decisions: Pick<
    ApprovalsDecisions,
    "paroleCommissionDecision" | "releaseDecision"
  >,
): ApplicationStatus {
  //TODO: After product decision, this may need to be updated.
  // paroleCommissionDecision == null might have a new status.
  return decisions.paroleCommissionDecision == null &&
    decisions.releaseDecision == null
    ? ApplicationStatus.WAITING_ON_PAROLE_BOARD
    : ApplicationStatus.WAITING_ON_PP;
}

export function computeAcceptHomePlanUpdates(
  providerApplications: Array<{
    id: string;
    providerId: string;
    stage: ApplicationStage;
    subStage: ApplicationSubStage;
  }>,
  selectedProviderId: string,
  // A Parole Commission Decision can be recorded before the home plan exists.
  paroleCommissionDecision: ParoleCommissionDecision | null = null,
): {
  staffUpdate: AcceptHomePlanStaffUpdate;
  providerUpdates: AcceptHomePlanProviderUpdate[];
} {
  const staffUpdate: AcceptHomePlanStaffUpdate = {
    stage: ApplicationStage.APPROVALS,
    status: computeApprovalsWaitStatus({
      paroleCommissionDecision,
      releaseDecision: null,
    }),
  };

  // Already-closed peers (e.g. Declined) keep their final sub-stage. Only still-
  // active providers are closed as Not Selected / Canceled when another home
  // plan is chosen.
  const providerUpdates = providerApplications.flatMap((row) => {
    if (row.providerId === selectedProviderId) {
      return [
        {
          providerApplicationId: row.id,
          stage: ApplicationStage.APPROVALS,
          subStage: ApplicationSubStage.SELECTED,
          status: ApplicationStatus.WAITING,
        },
      ];
    }

    if (row.stage === ApplicationStage.CLOSED) {
      return [];
    }

    return [
      {
        providerApplicationId: row.id,
        ...buildClosedProviderUpdate(row.subStage),
      },
    ];
  });

  return { staffUpdate, providerUpdates };
}

export function buildAcceptHomePlanWriteData(
  providerId: string,
  selectedProviderApplicationId: string,
  staffPseudonymizedId: string,
  providerApplications: Array<{
    id: string;
    providerId: string;
    stage: ApplicationStage;
    subStage: ApplicationSubStage;
  }>,
  paroleCommissionDecision: ParoleCommissionDecision | null = null,
): Prisma.HousingApplicationUpdateInput {
  const { staffUpdate, providerUpdates } = computeAcceptHomePlanUpdates(
    providerApplications,
    providerId,
    paroleCommissionDecision,
  );

  return {
    homePlan: {
      create: {
        type: HomePlanType.PROVIDER,
        selectedProviderId: providerId,
        selectedProviderApplicationId,
        createdByStaffPseudonymizedId: staffPseudonymizedId,
        releaseTasks: { create: buildInitialReleaseTaskRows() },
      },
    },
    staffApplication: { update: staffUpdate },
    providerApplications: buildProviderApplicationUpdates(providerUpdates),
  };
}

/**
 * A street address needs no approvals and no release tasks, so the case is
 * finished the moment it is set. It closes as CANCELED
 */
export const MANUAL_ADDRESS_CLOSED_SUB_STAGE = ApplicationSubStage.CANCELED;

export function computeManualAddressHomePlanProviderUpdates(
  providerApplications: HomePlanProviderApplicationRow[],
): AcceptHomePlanProviderUpdate[] {
  return providerApplications
    .filter((row) => row.stage !== ApplicationStage.CLOSED)
    .map((row) => ({
      providerApplicationId: row.id,
      ...buildClosedProviderUpdate(row.subStage),
    }));
}

export function buildManualAddressHomePlanWriteData(
  address: string,
  staffPseudonymizedId: string,
  providerApplications: HomePlanProviderApplicationRow[],
): Prisma.HousingApplicationUpdateInput {
  const providerUpdates =
    computeManualAddressHomePlanProviderUpdates(providerApplications);

  return {
    homePlan: {
      create: {
        type: HomePlanType.MANUAL_ADDRESS,
        address,
        createdByStaffPseudonymizedId: staffPseudonymizedId,
        releaseTasks: { create: buildInitialReleaseTaskRows() },
      },
    },
    staffApplication: {
      update: {
        stage: ApplicationStage.CLOSED,
        subStage: MANUAL_ADDRESS_CLOSED_SUB_STAGE,
        status: ApplicationStatus.DONE,
        // No "How did this case resolve?" popup runs on this path, so there is
        // no CM selection (or note) to retain.
        closedOutcome: null,
        closedOutcomeNote: null,
      },
    },
    ...(providerUpdates.length === 0
      ? {}
      : {
          providerApplications:
            buildProviderApplicationUpdates(providerUpdates),
        }),
  };
}

export function mergeApprovalsDecisions(
  persisted: ApprovalsDecisions,
  incoming: Partial<ApprovalsDecisions>,
): ApprovalsDecisions {
  return {
    paroleCommissionDecision:
      incoming.paroleCommissionDecision ?? persisted.paroleCommissionDecision,
    releaseDecision: incoming.releaseDecision ?? persisted.releaseDecision,
    homePlanInvestigation:
      incoming.homePlanInvestigation ?? persisted.homePlanInvestigation,
  };
}

function buildApprovalsHomePlanUpdate(
  decisions: ApprovalsDecisions,
  outcome: ApprovalsOutcome,
  staffPseudonymizedId: string,
): Prisma.HousingApplicationHomePlanUpdateWithoutApplicationInput {
  // Field by field: the Parole Commission Decision lives on the staff row.
  const homePlanDecisions = {
    releaseDecision: decisions.releaseDecision,
    homePlanInvestigation: decisions.homePlanInvestigation,
  };

  // The audit pair is stamped when the approvals reach a terminal state, not
  // when both columns happen to be set.
  if (outcome.type === "WAIT") {
    return homePlanDecisions;
  }

  return {
    ...homePlanDecisions,
    approvalsAt: new Date(),
    approvalsByStaffPseudonymizedId: staffPseudonymizedId,
  };
}

export function buildSetApprovalsWriteData(
  decisions: ApprovalsDecisions,
  outcome: ApprovalsOutcome,
  staffPseudonymizedId: string,
  selectedProviderApplicationId: string | null,
): Prisma.HousingApplicationUpdateInput {
  const homePlan = {
    update: buildApprovalsHomePlanUpdate(
      decisions,
      outcome,
      staffPseudonymizedId,
    ),
  };

  if (outcome.type === "WAIT") {
    return {
      homePlan,
      staffApplication: {
        update: { status: computeApprovalsWaitStatus(decisions) },
      },
    };
  }

  if (outcome.type === "ADVANCE") {
    const { staffStatus, selectedProviderStatus } = computeReleaseStageStatuses(
      ALL_RELEASE_TASKS_INCOMPLETE,
    );
    return {
      homePlan,
      staffApplication: {
        update: {
          stage: ApplicationStage.RELEASE,
          status: staffStatus,
        },
      },
      ...(selectedProviderApplicationId == null
        ? {}
        : {
            providerApplications: {
              update: {
                where: { id: selectedProviderApplicationId },
                data: {
                  stage: ApplicationStage.RELEASE,
                  status: selectedProviderStatus,
                },
              },
            },
          }),
    };
  }

  return {
    homePlan,
    staffApplication: {
      update: {
        stage: ApplicationStage.CLOSED,
        subStage: ApplicationSubStage.PLAN_REJECTED,
        status: ApplicationStatus.DONE,
        closedOutcome: outcome.closedOutcome,
        closedOutcomeNote: null,
      },
    },
    ...(selectedProviderApplicationId == null
      ? {}
      : {
          providerApplications: {
            update: {
              where: { id: selectedProviderApplicationId },
              data: {
                stage: ApplicationStage.CLOSED,
                subStage: ApplicationSubStage.CANCELED,
                status: ApplicationStatus.DONE,
              },
            },
          },
        }),
  };
}
