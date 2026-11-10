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

import type { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import {
  ApplicationStage,
  ApplicationSubStage,
  HomePlanInvestigationResult,
  HomePlanType,
  ParoleCommissionDecision,
  ReleaseDecision,
  type ReleaseTaskType,
  TaskCompletedByRole,
} from "~@idaho-th/prisma/client";
import {
  HOUSING_APPLICATION_ERRORS,
  ORDERED_RELEASE_TASK_TYPES,
} from "~@idaho-th/shared";
import {
  createHousingApplicationHomePlan,
  createHousingProvider,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  findStaffApprovalsHomePlan,
  findStaffHomePlan,
  findStaffHomePlanView,
  findStaffToggleReleaseTask,
  HOME_PLAN_BAD_REQUEST,
  HOME_PLAN_NOT_FOUND,
  requireStaffAcceptHomePlan,
  requireStaffApprovalsHomePlan,
  requireStaffHomePlanView,
  requireStaffToggleReleaseTask,
  resolveAcceptProviderHomePlanTarget,
  resolveSetApprovalsHomePlan,
  resolveSetManualAddressHomePlan,
  resolveToggleReleaseTaskHomePlan,
} from "../homePlan.helpers";
import type { HomePlanRow, ToggleReleaseTaskActor } from "../homePlan.types";
import {
  CONDITIONALLY_APPROVED_PROVIDER,
  seedApprovalsStageApplication,
  seedHomePlanApplication,
  seedReleaseStageApplication,
  TEST_HOUSING_PROVIDER_NAME,
} from "./homePlan.fixtures";

// Every resolver takes a row the service already loaded, so each test loads the
// same row through the same finder rather than hand-building a fake context.
async function loadAcceptContext(applicationId: string) {
  const context = await findStaffHomePlan(
    testPrismaClient,
    applicationId,
    TEST_STAFF_PSEUDONYMIZED_ID,
  );
  requireStaffAcceptHomePlan(context);
  return context;
}

async function loadHomePlanViewContext(applicationId: string) {
  const context = await findStaffHomePlanView(
    testPrismaClient,
    applicationId,
    TEST_STAFF_PSEUDONYMIZED_ID,
  );
  requireStaffHomePlanView(context);
  return context;
}

async function loadApprovalsContext(applicationId: string) {
  const context = await findStaffApprovalsHomePlan(
    testPrismaClient,
    applicationId,
    TEST_STAFF_PSEUDONYMIZED_ID,
  );
  requireStaffApprovalsHomePlan(context);
  return context;
}

async function loadToggleReleaseTaskContext(applicationId: string) {
  const context = await findStaffToggleReleaseTask(
    testPrismaClient,
    applicationId,
    TEST_STAFF_PSEUDONYMIZED_ID,
  );
  requireStaffToggleReleaseTask(context);
  return context;
}

const STAFF_ACTOR: ToggleReleaseTaskActor = {
  role: TaskCompletedByRole.STAFF,
  pseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
};

function providerActor(
  providerId: string,
  pseudonymizedId = TEST_PROVIDER_PSEUDONYMIZED_ID,
): ToggleReleaseTaskActor {
  return {
    role: TaskCompletedByRole.PROVIDER,
    pseudonymizedId,
    providerId,
  };
}

/** The seeded row id for a task type, read off the loaded context. */
function releaseTaskId(
  context: { homePlan: HomePlanRow | null },
  taskType: ReleaseTaskType,
): string {
  const task = context.homePlan?.releaseTasks.find(
    (row) => row.taskType === taskType,
  );

  if (task == null) {
    throw new Error(`No seeded release task for ${taskType}`);
  }
  return task.id;
}

describe("resolveAcceptProviderHomePlanTarget", () => {
  it("returns the selected provider application id", async () => {
    const { application, providers, providerApplications } =
      await seedHomePlanApplication(testPrismaClient, {
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      });
    const context = await loadAcceptContext(application.id);

    expect(
      resolveAcceptProviderHomePlanTarget(context, providers[0].id),
    ).toEqual({
      providerId: providers[0].id,
      providerName: TEST_HOUSING_PROVIDER_NAME,
      selectedProviderApplicationId: providerApplications[0].id,
    });
  });

  it("rejects when the application was not sent to providers", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        sentToProvidersAt: null,
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      },
    );
    const context = await loadAcceptContext(application.id);

    expect(() =>
      resolveAcceptProviderHomePlanTarget(context, providers[0].id),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.NOT_SENT_TO_PROVIDERS,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when a home plan already exists", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
        homePlan: {},
      },
    );
    const context = await loadAcceptContext(application.id);

    expect(() =>
      resolveAcceptProviderHomePlanTarget(context, providers[0].id),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.HOME_PLAN_ALREADY_SET,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects closed applications", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        stage: ApplicationStage.CLOSED,
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      },
    );
    const context = await loadAcceptContext(application.id);

    expect(() =>
      resolveAcceptProviderHomePlanTarget(context, providers[0].id),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOUSING_APPLICATION_ERRORS.CASE_CLOSED,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when the provider is not on the application", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      providers: [CONDITIONALLY_APPROVED_PROVIDER],
    });
    const unrelatedProvider = await createHousingProvider(testPrismaClient);
    const context = await loadAcceptContext(application.id);

    expect(() =>
      resolveAcceptProviderHomePlanTarget(context, unrelatedProvider.id),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.PROVIDER_NOT_ON_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when the provider is not conditionally approved", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        providers: [{ subStage: ApplicationSubStage.PROVIDER_REVIEW }],
      },
    );
    const context = await loadAcceptContext(application.id);

    expect(() =>
      resolveAcceptProviderHomePlanTarget(context, providers[0].id),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.PROVIDER_NOT_CONDITIONALLY_APPROVED,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("resolveSetManualAddressHomePlan", () => {
  it("allows setting a manual address when no home plan exists", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient);
    const context = await loadHomePlanViewContext(application.id);

    expect(() => resolveSetManualAddressHomePlan(context)).not.toThrow();
  });

  it("rejects when a home plan already exists", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      providers: [CONDITIONALLY_APPROVED_PROVIDER],
      homePlan: {},
    });
    const context = await loadHomePlanViewContext(application.id);

    expect(() => resolveSetManualAddressHomePlan(context)).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.HOME_PLAN_ALREADY_SET,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects closed applications", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
    });
    const context = await loadHomePlanViewContext(application.id);

    expect(() => resolveSetManualAddressHomePlan(context)).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOUSING_APPLICATION_ERRORS.CASE_CLOSED,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects draft applications", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.DRAFT,
      sentToProvidersAt: null,
    });
    const context = await loadHomePlanViewContext(application.id);

    expect(() => resolveSetManualAddressHomePlan(context)).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOUSING_APPLICATION_ERRORS.CASE_DRAFT,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("resolveSetApprovalsHomePlan", () => {
  it("returns the selected provider application id and the empty decisions", async () => {
    const { application, providerApplications } =
      await seedApprovalsStageApplication(testPrismaClient);
    const context = await loadApprovalsContext(application.id);

    expect(resolveSetApprovalsHomePlan(context, {})).toEqual({
      selectedProviderApplicationId: providerApplications[0].id,
      persisted: {
        paroleCommissionDecision: null,
        releaseDecision: null,
        homePlanInvestigation: null,
      },
      isRider: false,
    });
  });

  it("returns a Termer's stored Parole Commission Decision for the gate", async () => {
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      { paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED },
    );
    const context = await loadApprovalsContext(application.id);

    expect(resolveSetApprovalsHomePlan(context, {})).toMatchObject({
      persisted: {
        paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
      },
      isRider: false,
    });
  });

  it("returns a Rider's recorded decision so a partial save can be merged", async () => {
    const { application, providerApplications } =
      await seedApprovalsStageApplication(testPrismaClient, {
        legalCurrentStatus: "Rider",
        homePlan: { releaseDecision: ReleaseDecision.PROBATION_GRANTED },
      });
    const context = await loadApprovalsContext(application.id);

    expect(resolveSetApprovalsHomePlan(context, {})).toEqual({
      selectedProviderApplicationId: providerApplications[0].id,
      persisted: {
        paroleCommissionDecision: null,
        releaseDecision: ReleaseDecision.PROBATION_GRANTED,
        homePlanInvestigation: null,
      },
      isRider: true,
    });
  });

  it("rejects a release decision for a Termer/PV", async () => {
    const { application } =
      await seedApprovalsStageApplication(testPrismaClient);
    const context = await loadApprovalsContext(application.id);

    expect(() =>
      resolveSetApprovalsHomePlan(context, {
        releaseDecision: ReleaseDecision.PROBATION_GRANTED,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_DECISION_RIDER_ONLY,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects a not-applicable investigation for a Rider", async () => {
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      { legalCurrentStatus: "Rider" },
    );
    const context = await loadApprovalsContext(application.id);

    expect(() =>
      resolveSetApprovalsHomePlan(context, {
        homePlanInvestigation: HomePlanInvestigationResult.NOT_APPLICABLE,
      }),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.INVESTIGATION_NOT_APPLICABLE_NOT_ALLOWED,
      } satisfies Partial<TRPCError>),
    );
  });

  it("has no provider application to sync for a manual-address plan", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.APPROVALS,
      homePlan: { type: HomePlanType.MANUAL_ADDRESS },
    });
    const context = await loadApprovalsContext(application.id);

    expect(resolveSetApprovalsHomePlan(context, {})).toMatchObject({
      selectedProviderApplicationId: null,
    });
  });

  it("rejects when no home plan exists", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.APPROVALS,
    });
    const context = await loadApprovalsContext(application.id);

    expect(() => resolveSetApprovalsHomePlan(context, {})).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOME_PLAN_NOT_FOUND.HOME_PLAN,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when the case is not in the Approvals stage", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);
    const context = await loadApprovalsContext(application.id);

    expect(() => resolveSetApprovalsHomePlan(context, {})).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.APPROVALS_NOT_IN_PROGRESS,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when the selected provider is not on the application", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.APPROVALS,
    });
    // A plan pointing at a provider that was never added to this application.
    const unrelatedProvider = await createHousingProvider(testPrismaClient);
    await createHousingApplicationHomePlan(testPrismaClient, {
      applicationId: application.id,
      type: HomePlanType.PROVIDER,
      address: null,
      selectedProviderId: unrelatedProvider.id,
    });
    const context = await loadApprovalsContext(application.id);

    expect(() => resolveSetApprovalsHomePlan(context, {})).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.SELECTED_PROVIDER_NOT_ON_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("resolveToggleReleaseTaskHomePlan", () => {
  it("returns the task id for a staff-owned task", async () => {
    const { application, providerApplications } =
      await seedReleaseStageApplication(testPrismaClient);
    const context = await loadToggleReleaseTaskContext(application.id);

    const result = resolveToggleReleaseTaskHomePlan(
      context,
      STAFF_ACTOR,
      "HOUSING_DATE_REQUESTED",
    );

    expect(result).toMatchObject({
      taskId: releaseTaskId(context, "HOUSING_DATE_REQUESTED"),
      selectedProviderApplicationId: providerApplications[0].id,
      isManualAddressPlan: false,
    });
    expect(result.releaseTasks.map((task) => task.taskType)).toEqual(
      expect.arrayContaining([...ORDERED_RELEASE_TASK_TYPES]),
    );
  });

  it("returns the task id for a provider-owned task", async () => {
    const { application, providers, providerApplications } =
      await seedReleaseStageApplication(testPrismaClient);
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(
      resolveToggleReleaseTaskHomePlan(
        context,
        providerActor(providers[0].id),
        "FUNDING_SECURED",
      ),
    ).toMatchObject({
      taskId: releaseTaskId(context, "FUNDING_SECURED"),
      selectedProviderApplicationId: providerApplications[0].id,
      isManualAddressPlan: false,
    });
  });

  it("rejects staff toggling provider-owned tasks when a provider is selected", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(() =>
      resolveToggleReleaseTaskHomePlan(context, STAFF_ACTOR, "BED_CONFIRMED"),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects providers toggling staff-owned tasks", async () => {
    const { application, providers } =
      await seedReleaseStageApplication(testPrismaClient);
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(() =>
      resolveToggleReleaseTaskHomePlan(
        context,
        providerActor(providers[0].id),
        "HOUSING_DATE_REQUESTED",
      ),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_STAFF,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects provider toggles when the caller is not the selected provider", async () => {
    const { application, providers } = await seedReleaseStageApplication(
      testPrismaClient,
      {
        extraProviders: [
          {
            name: "Second Chance Housing",
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.NOT_SELECTED,
          },
        ],
      },
    );
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(() =>
      resolveToggleReleaseTaskHomePlan(
        context,
        providerActor(
          providers[1].id,
          "colleague-at-the-other-housing-provider",
        ),
        "FUNDING_SECURED",
      ),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_NOT_OWNED,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects toggles outside the release stage", async () => {
    const { application, providers } =
      await seedApprovalsStageApplication(testPrismaClient);
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(() =>
      resolveToggleReleaseTaskHomePlan(
        context,
        providerActor(providers[0].id),
        "FUNDING_SECURED",
      ),
    ).toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASKS_NOT_ACTIVE,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects toggles when no home plan exists", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.RELEASE,
    });
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(() =>
      resolveToggleReleaseTaskHomePlan(
        context,
        STAFF_ACTOR,
        "HOUSING_DATE_REQUESTED",
      ),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOME_PLAN_NOT_FOUND.HOME_PLAN,
      } satisfies Partial<TRPCError>),
    );
  });

  it("allows staff to toggle provider-owned tasks for manual-address home plans", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.RELEASE,
      homePlan: {
        type: HomePlanType.MANUAL_ADDRESS,
        homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
      },
    });
    const context = await loadToggleReleaseTaskContext(application.id);

    expect(
      resolveToggleReleaseTaskHomePlan(context, STAFF_ACTOR, "FUNDING_SECURED"),
    ).toMatchObject({
      taskId: releaseTaskId(context, "FUNDING_SECURED"),
      // No provider on the application, so there is no provider row to sync.
      selectedProviderApplicationId: null,
      isManualAddressPlan: true,
    });
  });
});
