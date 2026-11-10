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
import { describe, expect } from "vitest";

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  ADVANCE_STAGE_BAD_REQUEST,
  STAFF_APPLICATION_NOT_FOUND,
} from "~@idaho-th/trpc/routes/staffApplication/staffApplication.constants";
import { advanceApplicationStage } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.service";
import { TEST_STAFF_PSEUDONYMIZED_ID } from "~@idaho-th/trpc/test/factories";
import {
  readProviderApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedStaffApplication } from "./staffApplication.fixtures";

describe("advanceApplicationStage", () => {
  test("advances forward and moves the selected provider with the case", async () => {
    const { application, providerApplications } = await seedStaffApplication(
      testPrismaClient,
      {
        stage: ApplicationStage.APPROVALS,
        subStage: ApplicationSubStage.SELECTED,
        status: ApplicationStatus.WAITING,
        providerApplicationStages: [ApplicationStage.APPROVALS],
        homePlan: "provider",
        approvalsCleared: true,
      },
    );

    const result = await advanceApplicationStage(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        targetStage: ApplicationStage.RELEASE,
      },
    );

    // Release tasks can be completed in any order (not a fixed relay), so
    // staff starts with their own unstarted tasks needing action.
    expect(result).toEqual({
      applicationId: application.id,
      stage: ApplicationStage.RELEASE,
      subStage: ApplicationSubStage.SELECTED,
      status: ApplicationStatus.ACTION_NEEDED,
      closedOutcome: null,
      closedOutcomeNote: null,
    });

    const updatedStaffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(updatedStaffApplication.stage).toBe(ApplicationStage.RELEASE);
    expect(updatedStaffApplication.status).toBe(
      ApplicationStatus.ACTION_NEEDED,
    );

    // The release checklist starts empty and tasks can be completed in any
    // order, so both staff and the provider own their own next action.
    const updatedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplications[0].id,
    );
    expect(updatedProviderApplication.stage).toBe(ApplicationStage.RELEASE);
    expect(updatedProviderApplication.status).toBe(
      ApplicationStatus.ACTION_NEEDED,
    );

    // A manual stage advance must be visible on the Timeline (PRD §3.4).
    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.STAGE_ADVANCED,
      description: "Stage set to 'Release'",
      actorRole: TimelineActorRole.STAFF,
      actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      metadata: {
        fromStage: ApplicationStage.APPROVALS,
        toStage: ApplicationStage.RELEASE,
      },
    });
  });

  test("rejects a backward transition", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.RELEASE,
      homePlan: "address",
    });

    await expect(
      advanceApplicationStage(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        targetStage: ApplicationStage.APPROVALS,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: ADVANCE_STAGE_BAD_REQUEST.NOT_FORWARD,
      } satisfies Partial<TRPCError>),
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.RELEASE);
  });

  test("rejects reopening a closed case", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
      homePlan: "address",
    });

    await expect(
      advanceApplicationStage(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        targetStage: ApplicationStage.RELEASE,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: ADVANCE_STAGE_BAD_REQUEST.CASE_CLOSED,
      } satisfies Partial<TRPCError>),
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.CLOSED);
  });

  test("rejects advancing to Release without a home plan", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await expect(
      advanceApplicationStage(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        applicationId: application.id,
        targetStage: ApplicationStage.RELEASE,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: ADVANCE_STAGE_BAD_REQUEST.HOME_PLAN_REQUIRED,
      } satisfies Partial<TRPCError>),
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.APPLICATION);
  });

  test("allows closing from Application without a home plan and records the outcome", async () => {
    const { application, providerApplications } = await seedStaffApplication(
      testPrismaClient,
      { providerApplicationStages: [ApplicationStage.APPLICATION] },
    );

    await advanceApplicationStage(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        targetStage: ApplicationStage.CLOSED,
        closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
      },
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication).toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
      closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
      closedOutcomeNote: null,
    });

    const providerApplication = await readProviderApplication(
      testPrismaClient,
      providerApplications[0].id,
    );
    expect(providerApplication).toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
    });

    // Closing must also land a CASE_CLOSED timeline event (PRD §3.4 / §4).
    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.CASE_CLOSED,
      actorRole: TimelineActorRole.STAFF,
      actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      metadata: { closedSubStage: ApplicationSubStage.CANCELED },
    });
  });

  test("closes as CLIENT_RELEASED without resurrecting already-canceled providers", async () => {
    const { application, providerApplications } = await seedStaffApplication(
      testPrismaClient,
      {
        stage: ApplicationStage.APPROVALS,
        // A manual-address home plan means no provider was released to.
        homePlan: "address",
        providerApplicationStages: [
          {
            stage: ApplicationStage.CLOSED,
            subStage: ApplicationSubStage.CANCELED,
            status: ApplicationStatus.DONE,
          },
        ],
      },
    );
    const closedProviderApplication = await readProviderApplication(
      testPrismaClient,
      providerApplications[0].id,
    );

    await advanceApplicationStage(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        targetStage: ApplicationStage.CLOSED,
        closedOutcome: ClosedOutcome.CLIENT_RELEASED,
      },
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication).toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.RELEASED,
      status: ApplicationStatus.DONE,
      closedOutcome: ClosedOutcome.CLIENT_RELEASED,
      closedOutcomeNote: null,
    });

    // The already-closed provider application must not be written at all —
    // re-closing it would resurrect a CANCELED provider as RELEASED.
    const providerApplication = await readProviderApplication(
      testPrismaClient,
      providerApplications[0].id,
    );
    expect(providerApplication).toEqual(closedProviderApplication);
  });

  test("rejects advancing another staff member's application", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.APPROVALS,
      providerApplicationStages: [ApplicationStage.APPROVALS],
      homePlan: "provider",
    });

    await expect(
      advanceApplicationStage(testPrismaClient, "some-other-staff", {
        applicationId: application.id,
        targetStage: ApplicationStage.RELEASE,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.APPROVALS);
  });
});

describe("closing a case with a provider that revoked", () => {
  test("keeps the provider's revoke instead of canceling it", async () => {
    const { application, providerApplications } = await seedStaffApplication(
      testPrismaClient,
      {
        providerApplicationStages: [
          {
            stage: ApplicationStage.APPLICATION,
            subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
            status: ApplicationStatus.DONE,
          },
        ],
      },
    );

    await advanceApplicationStage(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        applicationId: application.id,
        targetStage: ApplicationStage.CLOSED,
        closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
      },
    );

    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      status: ApplicationStatus.DONE,
    });
    const events = await readTimelineEvents(testPrismaClient, application.id);
    expect(
      events.some(
        (event) => event.eventType === TimelineEventType.PROVIDER_CANCELED,
      ),
    ).toBe(false);
  });
});
