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
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  HomePlanInvestigationResult,
  HomePlanType,
  ParoleCommissionDecision,
  ReleaseDecision,
  type ReleaseTaskType,
  TaskCompletedByRole,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { HOUSING_APPLICATION_ERRORS } from "~@idaho-th/shared";
import {
  HOME_PLAN_BAD_REQUEST,
  HOME_PLAN_EMPTY_TAB_MESSAGE,
  HOME_PLAN_NOT_FOUND,
} from "~@idaho-th/trpc/routes/homePlan/homePlan.helpers";
import {
  acceptProviderAsHomePlan,
  getProviderHomePlan,
  getStaffHomePlan,
  setHomePlanApprovals,
  setManualAddressHomePlan,
  toggleProviderHomePlanReleaseTask,
  toggleStaffHomePlanReleaseTask,
  updateProviderHomePlanReleaseTaskDetail,
  updateStaffHomePlanReleaseTaskDetail,
} from "~@idaho-th/trpc/routes/homePlan/homePlan.service";
import {
  createHousingProvider,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readProviderApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  CONDITIONALLY_APPROVED_PROVIDER,
  seedApprovalsStageApplication,
  seedHomePlanApplication,
  seedReleaseStageApplication,
  TEST_APPROVALS_AT,
  TEST_HOME_PLAN_ADDRESS,
  TEST_HOUSING_PROVIDER_NAME,
} from "./homePlan.fixtures";

/**
 * The organization the provider acts as. These tests call the services
 * directly, so they need the organization but not the assignment the provider
 * middleware checks — the router tests cover that path.
 */
function seedHousingProvider(name = TEST_HOUSING_PROVIDER_NAME) {
  return createHousingProvider(testPrismaClient, { name });
}

function readHomePlan(applicationId: string) {
  return testPrismaClient.housingApplicationHomePlan.findUniqueOrThrow({
    where: { applicationId },
  });
}

function readReleaseTask(applicationId: string, taskType: ReleaseTaskType) {
  return testPrismaClient.housingApplicationReleaseTask.findFirstOrThrow({
    where: { homePlan: { applicationId }, taskType },
  });
}

describe("getStaffHomePlan", () => {
  it("returns an empty home plan state", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient);

    const result = await getStaffHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    expect(result.homePlan).toBeNull();
    expect(result.approvals).toBeNull();
    expect(result.releaseTasks).toBeNull();
    expect(result.permissions.canSetHomePlan).toBe(true);
    expect(result.emptyTabMessage).toBeNull();
  });

  it("returns the persisted home plan", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      { providerId: housingProvider.id },
    );

    const result = await getStaffHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    // The organization only — its people are HousingProviderUser rows now, and
    // this one has none assigned, so there is no contact to show.
    expect(result.homePlan?.provider).toEqual({
      providerId: housingProvider.id,
      name: TEST_HOUSING_PROVIDER_NAME,
      status: "ACCEPTED_AS_HOME_PLAN",
      contact: null,
    });
    expect(result.approvals?.badge).toBe("PENDING");
    expect(result.permissions.canSetApprovals).toBe(true);
    expect(result.releaseTasks?.active).toBe(false);
  });

  it("returns the rejected approvals badge after a failed home plan investigation", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.PLAN_REJECTED,
      providers: [CONDITIONALLY_APPROVED_PROVIDER],
      homePlan: {
        homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
        approvalsAt: TEST_APPROVALS_AT,
      },
    });

    const result = await getStaffHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id },
    );

    expect(result.stage).toBe(ApplicationStage.CLOSED);
    expect(result.approvals).toEqual({
      badge: "HOUSING_PLAN_REJECTED",
      releaseDecision: null,
      homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
      approvalsAt: TEST_APPROVALS_AT,
    });
    expect(result.permissions.canSetApprovals).toBe(false);
    expect(result.releaseTasks?.active).toBe(false);
  });

  it("throws when another staff member owns the application", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient);

    await expect(
      getStaffHomePlan(testPrismaClient, "someone-else", {
        applicationId: application.id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOME_PLAN_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("getProviderHomePlan", () => {
  it("returns the empty tab message when the provider is not selected", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      providers: [{ providerId: housingProvider.id }],
    });

    const result = await getProviderHomePlan(
      testPrismaClient,
      housingProvider.id,
      { applicationId: application.id },
    );

    expect(result.homePlan).toBeNull();
    expect(result.emptyTabMessage).toBe(HOME_PLAN_EMPTY_TAB_MESSAGE);
    expect(result.permissions.isSelectedProvider).toBe(false);
  });

  it("returns the home plan — but never the CM's decisions — when the provider is selected", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      { providerId: housingProvider.id },
    );

    const result = await getProviderHomePlan(
      testPrismaClient,
      housingProvider.id,
      { applicationId: application.id },
    );

    expect(result.homePlan?.provider?.providerId).toBe(housingProvider.id);
    expect(result.permissions.isSelectedProvider).toBe(true);
    expect(result.permissions.canSetApprovals).toBe(false);
    expect(result.approvals).toEqual({
      badge: "PENDING",
      releaseDecision: null,
      homePlanInvestigation: null,
      approvalsAt: null,
    });
    expect(result.emptyTabMessage).toBeNull();
  });

  it("does not expose a home plan matched to another provider", async () => {
    const housingProvider = await seedHousingProvider();
    const otherHousingProvider = await seedHousingProvider(
      "Second Chance Housing",
    );
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      { providerId: otherHousingProvider.id },
    );

    await expect(
      getProviderHomePlan(testPrismaClient, housingProvider.id, {
        applicationId: application.id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOME_PLAN_NOT_FOUND.PROVIDER_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("setManualAddressHomePlan", () => {
  it("creates the plan, closes every active provider, and closes the case", async () => {
    const { application, providers, providerApplications } =
      await seedHomePlanApplication(testPrismaClient, {
        providers: [
          CONDITIONALLY_APPROVED_PROVIDER,
          {
            name: "Second Chance Housing",
            subStage: ApplicationSubStage.PROVIDER_REVIEW,
          },
        ],
      });

    const result = await setManualAddressHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, address: TEST_HOME_PLAN_ADDRESS },
    );

    expect(result.homePlan).toMatchObject({
      type: HomePlanType.MANUAL_ADDRESS,
      address: TEST_HOME_PLAN_ADDRESS,
      provider: null,
    });
    expect(result.stage).toBe(ApplicationStage.CLOSED);

    await expect(readHomePlan(application.id)).resolves.toMatchObject({
      type: HomePlanType.MANUAL_ADDRESS,
      address: TEST_HOME_PLAN_ADDRESS,
      selectedProviderId: null,
      createdByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
    // An address home plan skips Approvals and Release entirely and closes as
    // CANCELED, with no CM-selected outcome behind it.
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
      closedOutcome: null,
    });

    // A conditionally-approved provider was passed over; the rest were canceled.
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.NOT_SELECTED,
      status: ApplicationStatus.DONE,
    });
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[1].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.HOME_PLAN_ADDRESS_SET,
          description: `Home plan set: ${TEST_HOME_PLAN_ADDRESS}`,
          actorRole: TimelineActorRole.STAFF,
          actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
          // The address is the CM's business only and must never reach a provider.
          cmOnly: true,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.PROVIDER_NOT_SELECTED,
          scopedProviderId: providers[0].id,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.PROVIDER_CANCELED,
          scopedProviderId: providers[1].id,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.CASE_CLOSED,
          description: "Stage set to 'Closed'",
          actorRole: TimelineActorRole.SYSTEM,
          metadata: { closedSubStage: ApplicationSubStage.CANCELED },
        }),
      ]),
    );
  });

  it("rejects when a home plan already exists", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      providers: [CONDITIONALLY_APPROVED_PROVIDER],
      homePlan: {},
    });

    await expect(
      setManualAddressHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        address: TEST_HOME_PLAN_ADDRESS,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.HOME_PLAN_ALREADY_SET,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects draft applications", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.DRAFT,
      sentToProvidersAt: null,
    });

    await expect(
      setManualAddressHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        address: TEST_HOME_PLAN_ADDRESS,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOUSING_APPLICATION_ERRORS.CASE_DRAFT,
      } satisfies Partial<TRPCError>),
    );

    // The draft is untouched — still a draft, not closed out from under it.
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ stage: ApplicationStage.DRAFT });
  });

  it("still allows an application that has not been sent to providers", async () => {
    // A street address is reachable before any provider is contacted — the
    // client found housing on their own — so the draft guard must not take
    // that flow with it.
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.APPLICATION,
      sentToProvidersAt: null,
    });

    const result = await setManualAddressHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, address: TEST_HOME_PLAN_ADDRESS },
    );

    expect(result.stage).toBe(ApplicationStage.CLOSED);
  });

  it("rejects closed applications", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
    });

    await expect(
      setManualAddressHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        address: TEST_HOME_PLAN_ADDRESS,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOUSING_APPLICATION_ERRORS.CASE_CLOSED,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      testPrismaClient.housingApplicationHomePlan.findUnique({
        where: { applicationId: application.id },
      }),
    ).resolves.toBeNull();
  });
});

describe("acceptProviderAsHomePlan", () => {
  it("creates the provider home plan and advances to approvals", async () => {
    const { application, providers, providerApplications } =
      await seedHomePlanApplication(testPrismaClient, {
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      });

    const result = await acceptProviderAsHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, providerId: providers[0].id },
    );

    expect(result.applicationId).toBe(application.id);
    expect(result.stage).toBe(ApplicationStage.APPROVALS);
    expect(result.homePlan?.provider).toEqual({
      providerId: providers[0].id,
      name: TEST_HOUSING_PROVIDER_NAME,
      status: "ACCEPTED_AS_HOME_PLAN",
      contact: null,
    });
    expect(result.approvals?.badge).toBe("PENDING");
    expect(result.permissions.canSetApprovals).toBe(true);
    expect(result.releaseTasks?.totalCount).toBe(7);

    await expect(readHomePlan(application.id)).resolves.toMatchObject({
      type: HomePlanType.PROVIDER,
      selectedProviderId: providers[0].id,
      selectedProviderApplicationId: providerApplications[0].id,
      createdByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ stage: ApplicationStage.APPROVALS });
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.APPROVALS,
      subStage: ApplicationSubStage.SELECTED,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.PROVIDER_SELECTED_AS_HOME_PLAN,
          description: `Home plan set: ${TEST_HOUSING_PROVIDER_NAME}`,
          actorRole: TimelineActorRole.STAFF,
          actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
          scopedProviderId: providers[0].id,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.STAGE_ADVANCED,
          metadata: {
            fromStage: ApplicationStage.APPLICATION,
            toStage: ApplicationStage.APPROVALS,
          },
        }),
      ]),
    );
  });

  // The Commission can rule in Application, before the home plan exists: the
  // stored decision decides who the case waits on once it reaches Approvals.
  it.each([
    [undefined, ApplicationStatus.WAITING_ON_PAROLE_BOARD],
    [ParoleCommissionDecision.PAROLE_GRANTED, ApplicationStatus.WAITING_ON_PP],
    [ParoleCommissionDecision.NOT_APPLICABLE, ApplicationStatus.WAITING_ON_PP],
  ])(
    "enters Approvals waiting on the right party when the stored Parole Commission Decision is %s",
    async (paroleCommissionDecision, expectedStatus) => {
      const { application, providers } = await seedHomePlanApplication(
        testPrismaClient,
        {
          providers: [CONDITIONALLY_APPROVED_PROVIDER],
          paroleCommissionDecision,
        },
      );

      await acceptProviderAsHomePlan(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        { applicationId: application.id, providerId: providers[0].id },
      );

      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({
        stage: ApplicationStage.APPROVALS,
        status: expectedStatus,
      });
    },
  );

  it("records PROVIDER_NOT_SELECTED/PROVIDER_CANCELED for other providers, but not declined ones", async () => {
    const { application, providers, providerApplications } =
      await seedHomePlanApplication(testPrismaClient, {
        providers: [
          CONDITIONALLY_APPROVED_PROVIDER,
          {
            name: "Second Chance Housing",
            subStage: ApplicationSubStage.PROVIDER_REVIEW,
          },
          {
            name: "Third Provider",
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.DECLINED,
          },
          {
            name: "Fourth Provider",
            subStage: ApplicationSubStage.CONDITIONALLY_APPROVED,
          },
        ],
      });

    await acceptProviderAsHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, providerId: providers[0].id },
    );

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    // providers[0] (CONDITIONALLY_APPROVED) won the home plan. providers[3]
    // was also conditionally approved and got passed over -- NOT_SELECTED.
    // providers[1] never responded -- CANCELED. providers[2] already declined
    // and isn't touched at all.
    const notSelectedProviderIds = timelineEvents
      .filter(
        (event) => event.eventType === TimelineEventType.PROVIDER_NOT_SELECTED,
      )
      .map((event) => event.scopedProviderId);
    expect(notSelectedProviderIds).toEqual([providers[3].id]);

    const canceledProviderIds = timelineEvents
      .filter(
        (event) => event.eventType === TimelineEventType.PROVIDER_CANCELED,
      )
      .map((event) => event.scopedProviderId);
    expect(canceledProviderIds).toEqual([providers[1].id]);

    // An already-declined peer keeps its final sub-stage.
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[2].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.DECLINED,
    });
  });

  it("rejects when the provider is not conditionally approved", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        providers: [
          {
            subStage: ApplicationSubStage.PROVIDER_REVIEW,
          },
        ],
      },
    );

    await expect(
      acceptProviderAsHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        providerId: providers[0].id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.PROVIDER_NOT_CONDITIONALLY_APPROVED,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      testPrismaClient.housingApplicationHomePlan.findUnique({
        where: { applicationId: application.id },
      }),
    ).resolves.toBeNull();
  });

  it("rejects when a home plan already exists", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
        homePlan: {},
      },
    );

    await expect(
      acceptProviderAsHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        providerId: providers[0].id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.HOME_PLAN_ALREADY_SET,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when the application was not sent to providers", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        sentToProvidersAt: null,
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      },
    );

    await expect(
      acceptProviderAsHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        providerId: providers[0].id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.NOT_SENT_TO_PROVIDERS,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects when staff does not own the application", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      {
        staffPseudonymizedId: "someone-else",
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      },
    );

    await expect(
      acceptProviderAsHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        providerId: providers[0].id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOME_PLAN_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("setHomePlanApprovals", () => {
  // The release decision on the home plan is a Rider's; Termer/PV gate cases
  // are covered by the router and paroleCommissionDecision tests.
  const RIDER = { legalCurrentStatus: "Rider" };

  it("advances the case to release once both decisions clear", async () => {
    const { application, providerApplications } =
      await seedApprovalsStageApplication(testPrismaClient, RIDER);

    const result = await setHomePlanApprovals(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        releaseDecision: ReleaseDecision.PROBATION_GRANTED,
        homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
      },
    );

    expect(result.stage).toBe(ApplicationStage.RELEASE);
    expect(result.approvals?.badge).toBe("HOUSING_PLAN_APPROVED");
    expect(result.permissions.canToggleReleaseTasks).toBe(true);

    await expect(readHomePlan(application.id)).resolves.toMatchObject({
      releaseDecision: ReleaseDecision.PROBATION_GRANTED,
      homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
      approvalsByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ stage: ApplicationStage.RELEASE });
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.RELEASE,
      status: ApplicationStatus.ACTION_NEEDED,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED,
          actorRole: TimelineActorRole.STAFF,
          actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.STAGE_ADVANCED,
          metadata: {
            fromStage: ApplicationStage.APPROVALS,
            toStage: ApplicationStage.RELEASE,
          },
        }),
      ]),
    );
  });

  it("closes the case when the home plan investigation is rejected", async () => {
    const { application, providerApplications } =
      await seedApprovalsStageApplication(testPrismaClient, {
        ...RIDER,
        homePlan: { releaseDecision: ReleaseDecision.PROBATION_GRANTED },
      });

    const result = await setHomePlanApprovals(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
      },
    );

    expect(result.stage).toBe(ApplicationStage.CLOSED);
    expect(result.approvals?.badge).toBe("HOUSING_PLAN_REJECTED");
    expect(result.permissions.canSetApprovals).toBe(false);
    expect(result.releaseTasks?.active).toBe(false);

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.PLAN_REJECTED,
      status: ApplicationStatus.DONE,
      closedOutcome: ClosedOutcome.HOUSING_PLAN_REJECTED,
    });
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.APPROVALS_HOUSING_PLAN_REJECTED,
          actorRole: TimelineActorRole.STAFF,
        }),
        expect.objectContaining({
          eventType: TimelineEventType.CASE_CLOSED,
          actorRole: TimelineActorRole.SYSTEM,
          metadata: { closedSubStage: ApplicationSubStage.PLAN_REJECTED },
        }),
      ]),
    );
  });

  it("closes the case as release denied when probation is denied", async () => {
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      RIDER,
    );

    await setHomePlanApprovals(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
      applicationId: application.id,
      releaseDecision: ReleaseDecision.PROBATION_DENIED,
    });

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.RELEASE_DENIED,
    });
  });

  it("keeps a half-recorded case in approvals and off the timeline", async () => {
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      RIDER,
    );

    const result = await setHomePlanApprovals(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        releaseDecision: ReleaseDecision.PROBATION_GRANTED,
      },
    );

    expect(result.stage).toBe(ApplicationStage.APPROVALS);
    expect(result.approvals?.badge).toBe("PENDING");

    await expect(readHomePlan(application.id)).resolves.toMatchObject({
      releaseDecision: ReleaseDecision.PROBATION_GRANTED,
      homePlanInvestigation: null,
      // Only a terminal outcome stamps the audit pair.
      approvalsAt: null,
      approvalsByStaffPseudonymizedId: null,
    });
    await expect(
      readTimelineEvents(testPrismaClient, application.id),
    ).resolves.toEqual([]);
  });

  it("rejects decisions once the case has left the approvals stage", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);

    await expect(
      setHomePlanApprovals(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        homePlanInvestigation: HomePlanInvestigationResult.REJECTED,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.APPROVALS_NOT_IN_PROGRESS,
      } satisfies Partial<TRPCError>),
    );

    await expect(readHomePlan(application.id)).resolves.toMatchObject({
      homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
    });
  });
});

describe("toggleStaffHomePlanReleaseTask", () => {
  it("completes a staff-owned task and records the toggle", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);

    const result = await toggleStaffHomePlanReleaseTask(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        taskType: "HOUSING_DATE_REQUESTED",
        completed: true,
      },
    );

    expect(
      result.releaseTasks?.tasks.find(
        (task) => task.taskType === "HOUSING_DATE_REQUESTED",
      )?.completed,
    ).toBe(true);
    expect(result.releaseTasks?.completedCount).toBe(1);

    await expect(
      readReleaseTask(application.id, "HOUSING_DATE_REQUESTED"),
    ).resolves.toMatchObject({
      completed: true,
      completedByRole: TaskCompletedByRole.STAFF,
      completedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual([
      expect.objectContaining({
        eventType: TimelineEventType.RELEASE_TASK_UPDATED,
        description: "Release date requested",
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        metadata: {
          releaseTaskType: "HOUSING_DATE_REQUESTED",
          completed: true,
        },
      }),
    ]);
  });

  it("rejects staff toggling a provider-owned task", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);

    await expect(
      toggleStaffHomePlanReleaseTask(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          taskType: "BED_CONFIRMED",
          completed: true,
        },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_PROVIDER,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      readReleaseTask(application.id, "BED_CONFIRMED"),
    ).resolves.toMatchObject({ completed: false });
  });

  it("allows staff to toggle provider-owned tasks for manual-address home plans", async () => {
    // No provider on the application at all, so no provider row to sync.
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      stage: ApplicationStage.RELEASE,
      homePlan: {
        type: HomePlanType.MANUAL_ADDRESS,
        homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        approvalsAt: TEST_APPROVALS_AT,
      },
    });

    const result = await toggleStaffHomePlanReleaseTask(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        taskType: "BED_CONFIRMED",
        completed: true,
      },
    );

    expect(result.releaseTasks?.completedCount).toBe(1);
    await expect(
      readReleaseTask(application.id, "BED_CONFIRMED"),
    ).resolves.toMatchObject({
      completed: true,
      completedByRole: TaskCompletedByRole.STAFF,
    });
  });

  it("rejects toggles outside the release stage", async () => {
    const { application } =
      await seedApprovalsStageApplication(testPrismaClient);

    await expect(
      toggleStaffHomePlanReleaseTask(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          taskType: "HOUSING_DATE_REQUESTED",
          completed: true,
        },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASKS_NOT_ACTIVE,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      readReleaseTask(application.id, "HOUSING_DATE_REQUESTED"),
    ).resolves.toMatchObject({ completed: false });
  });
});

describe("toggleProviderHomePlanReleaseTask", () => {
  it("returns provider-facing home plan state after toggling an owned task", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedReleaseStageApplication(
      testPrismaClient,
      {
        providerId: housingProvider.id,
      },
    );

    const result = await toggleProviderHomePlanReleaseTask(
      testPrismaClient,
      {
        activeProviderId: housingProvider.id,
        providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      },
      {
        applicationId: application.id,
        taskType: "FUNDING_SECURED",
        completed: true,
      },
    );

    expect(result.permissions.isSelectedProvider).toBe(true);
    expect(result.releaseTasks?.active).toBe(true);
    expect(
      result.releaseTasks?.tasks.find(
        (task) => task.taskType === "FUNDING_SECURED",
      )?.completed,
    ).toBe(true);

    await expect(
      readReleaseTask(application.id, "FUNDING_SECURED"),
    ).resolves.toMatchObject({
      completed: true,
      completedByRole: TaskCompletedByRole.PROVIDER,
      completedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
    });

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toEqual([
      expect.objectContaining({
        eventType: TimelineEventType.RELEASE_TASK_UPDATED,
        description: "Funding has been received",
        actorRole: TimelineActorRole.PROVIDER,
        actorPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        metadata: {
          releaseTaskType: "FUNDING_SECURED",
          completed: true,
        },
      }),
    ]);
  });

  it("rejects a provider toggling a staff-owned task", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedReleaseStageApplication(
      testPrismaClient,
      {
        providerId: housingProvider.id,
      },
    );

    await expect(
      toggleProviderHomePlanReleaseTask(
        testPrismaClient,
        {
          activeProviderId: housingProvider.id,
          providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
        },
        {
          applicationId: application.id,
          taskType: "HOUSING_DATE_REQUESTED",
          completed: true,
        },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_STAFF,
      } satisfies Partial<TRPCError>),
    );
  });

  it("rejects toggles when the provider is not the selected one", async () => {
    const housingProvider = await seedHousingProvider();
    const notSelected = await seedHousingProvider("Second Chance Housing");
    // Both organizations are matched, but the plan points at the first.
    const { application } = await seedReleaseStageApplication(
      testPrismaClient,
      {
        providerId: housingProvider.id,
        extraProviders: [
          {
            providerId: notSelected.id,
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.NOT_SELECTED,
          },
        ],
      },
    );

    await expect(
      toggleProviderHomePlanReleaseTask(
        testPrismaClient,
        {
          activeProviderId: notSelected.id,
          providerPseudonymizedId: "colleague-at-the-other-housing-provider",
        },
        {
          applicationId: application.id,
          taskType: "FUNDING_SECURED",
          completed: true,
        },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_NOT_OWNED,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      readReleaseTask(application.id, "FUNDING_SECURED"),
    ).resolves.toMatchObject({ completed: false });
  });
});

describe("updateHomePlanReleaseTaskDetail", () => {
  it("sets the note on the Transportation Secured task", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);

    const result = await updateStaffHomePlanReleaseTaskDetail(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note: "Bus",
      },
    );

    expect(
      result.releaseTasks?.tasks.find(
        (task) => task.taskType === "TRANSPORTATION_SECURED",
      )?.note,
    ).toBe("Bus");

    await expect(
      readReleaseTask(application.id, "TRANSPORTATION_SECURED"),
    ).resolves.toMatchObject({ note: "Bus", completed: false });

    // The note autosaves on a debounce, so it deliberately records no event.
    await expect(
      readTimelineEvents(testPrismaClient, application.id),
    ).resolves.toEqual([]);
  });

  it("sets the note on the Resident Confirmed Funding task", async () => {
    const { application } = await seedReleaseStageApplication(testPrismaClient);

    const result = await updateStaffHomePlanReleaseTaskDetail(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        taskType: "RESIDENT_CONFIRMED_FUNDING",
        type: "text",
        note: "Self-pay",
      },
    );

    expect(
      result.releaseTasks?.tasks.find(
        (task) => task.taskType === "RESIDENT_CONFIRMED_FUNDING",
      )?.note,
    ).toBe("Self-pay");

    await expect(
      readReleaseTask(application.id, "RESIDENT_CONFIRMED_FUNDING"),
    ).resolves.toMatchObject({ note: "Self-pay", completed: false });
  });

  it("rejects note updates outside the release stage", async () => {
    const { application } =
      await seedApprovalsStageApplication(testPrismaClient);

    await expect(
      updateStaffHomePlanReleaseTaskDetail(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          taskType: "TRANSPORTATION_SECURED",
          type: "text",
          note: "Bus",
        },
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASKS_NOT_ACTIVE,
      } satisfies Partial<TRPCError>),
    );

    await expect(
      readReleaseTask(application.id, "TRANSPORTATION_SECURED"),
    ).resolves.toMatchObject({ note: null });
  });

  it("lets a provider set the note on their Transportation Instructions task", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedReleaseStageApplication(
      testPrismaClient,
      { providerId: housingProvider.id },
    );

    const result = await updateProviderHomePlanReleaseTaskDetail(
      testPrismaClient,
      {
        activeProviderId: housingProvider.id,
        providerPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      },
      {
        applicationId: application.id,
        taskType: "TRANSPORTATION_INSTRUCTIONS",
        type: "text",
        note: "Meet at XYZ bus station at 1pm on 10/28",
      },
    );

    expect(
      result.releaseTasks?.tasks.find(
        (task) => task.taskType === "TRANSPORTATION_INSTRUCTIONS",
      )?.note,
    ).toBe("Meet at XYZ bus station at 1pm on 10/28");
  });

  it("rejects a staff user setting the note on a provider-owned task", async () => {
    const housingProvider = await seedHousingProvider();
    const { application } = await seedReleaseStageApplication(
      testPrismaClient,
      { providerId: housingProvider.id },
    );

    await expect(
      updateStaffHomePlanReleaseTaskDetail(
        testPrismaClient,
        TEST_STAFF_PSEUDONYMIZED_ID,
        {
          applicationId: application.id,
          taskType: "TRANSPORTATION_INSTRUCTIONS",
          type: "text",
          note: "CM should not be able to write this",
        },
      ),
    ).rejects.toThrow();

    await expect(
      readReleaseTask(application.id, "TRANSPORTATION_INSTRUCTIONS"),
    ).resolves.toMatchObject({ note: null });
  });
});

describe("a provider that revoked its conditional approval", () => {
  const REVOKED_PROVIDER = {
    name: "Revoked Housing",
    subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
    status: ApplicationStatus.DONE,
  };

  async function readRevokedProvider(
    applicationId: string,
    providerApplicationId: string,
    providerId: string,
  ) {
    const providerApplication = await readProviderApplication(
      testPrismaClient,
      providerApplicationId,
    );
    const closingEvents = (
      await readTimelineEvents(testPrismaClient, applicationId)
    ).filter(
      (event) =>
        event.scopedProviderId === providerId &&
        (event.eventType === TimelineEventType.PROVIDER_CANCELED ||
          event.eventType === TimelineEventType.PROVIDER_NOT_SELECTED),
    );
    return { providerApplication, closingEvents };
  }

  const STILL_REVOKED = {
    stage: ApplicationStage.CLOSED,
    subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
    status: ApplicationStatus.DONE,
  };

  it("keeps its revoke when another provider is picked", async () => {
    const { application, providers, providerApplications } =
      await seedHomePlanApplication(testPrismaClient, {
        providers: [CONDITIONALLY_APPROVED_PROVIDER, REVOKED_PROVIDER],
      });

    await acceptProviderAsHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, providerId: providers[0].id },
    );

    const { providerApplication, closingEvents } = await readRevokedProvider(
      application.id,
      providerApplications[1].id,
      providers[1].id,
    );
    expect(providerApplication).toMatchObject(STILL_REVOKED);
    expect(closingEvents).toEqual([]);
  });

  it("keeps its revoke when a manual address is set", async () => {
    const { application, providers, providerApplications } =
      await seedHomePlanApplication(testPrismaClient, {
        providers: [REVOKED_PROVIDER],
      });

    await setManualAddressHomePlan(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { applicationId: application.id, address: TEST_HOME_PLAN_ADDRESS },
    );

    const { providerApplication, closingEvents } = await readRevokedProvider(
      application.id,
      providerApplications[0].id,
      providers[0].id,
    );
    expect(providerApplication).toMatchObject(STILL_REVOKED);
    expect(closingEvents).toEqual([]);
  });

  it("cannot be picked as the home plan", async () => {
    const { application, providers } = await seedHomePlanApplication(
      testPrismaClient,
      { providers: [REVOKED_PROVIDER] },
    );

    await expect(
      acceptProviderAsHomePlan(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        providerId: providers[0].id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.PROVIDER_NOT_CONDITIONALLY_APPROVED,
      } satisfies Partial<TRPCError>),
    );
  });
});
