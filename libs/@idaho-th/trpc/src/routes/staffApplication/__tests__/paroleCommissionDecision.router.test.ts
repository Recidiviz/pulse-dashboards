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

import { describe, expect, it } from "vitest";

import {
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ClosedOutcome,
  HomePlanInvestigationResult,
  ParoleCommissionDecision,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  CONDITIONALLY_APPROVED_PROVIDER,
  seedApprovalsStageApplication,
  seedHomePlanApplication,
  seedReleaseStageApplication,
} from "~@idaho-th/trpc/routes/homePlan/__tests__/homePlan.fixtures";
import { RELEASE_FLOW_BAD_REQUEST } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.constants";
import { staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  readProviderApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

function setDecision(
  applicationId: string,
  decision: ParoleCommissionDecision,
) {
  return staffCaller().housingApplication.setParoleCommissionDecision({
    applicationId,
    decision,
  });
}

describe("setParoleCommissionDecision", () => {
  it("stores the decision in Application without touching the providers' status", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      providers: [{}],
    });

    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED),
    ).resolves.toEqual({
      applicationId: application.id,
      stage: ApplicationStage.APPLICATION,
    });

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.APPLICATION,
      status: ApplicationStatus.WAITING,
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
    });
  });

  it("waits on P&P in Approvals until the investigation is in", async () => {
    const { application } =
      await seedApprovalsStageApplication(testPrismaClient);

    await setDecision(application.id, ParoleCommissionDecision.NOT_APPLICABLE);

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.APPROVALS,
      status: ApplicationStatus.WAITING_ON_PP,
    });
  });

  it("closes the case and every open provider when parole is denied before a home plan", async () => {
    const { application, providerApplications } = await seedHomePlanApplication(
      testPrismaClient,
      {
        providers: [
          {},
          CONDITIONALLY_APPROVED_PROVIDER,
          { subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED },
        ],
      },
    );

    await setDecision(application.id, ParoleCommissionDecision.PAROLE_DENIED);

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.PLAN_REJECTED,
      status: ApplicationStatus.DONE,
      closedOutcome: ClosedOutcome.RELEASE_DENIED,
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_DENIED,
    });

    const providerSubStages = await Promise.all(
      providerApplications.map(async ({ id }) => {
        const row = await readProviderApplication(testPrismaClient, id);
        return [row.stage, row.subStage];
      }),
    );
    expect(providerSubStages).toEqual([
      [ApplicationStage.CLOSED, ApplicationSubStage.CANCELED],
      [ApplicationStage.CLOSED, ApplicationSubStage.CANCELED],
      [
        ApplicationStage.CLOSED,
        ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      ],
    ]);

    const events = await readTimelineEvents(testPrismaClient, application.id);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED,
          cmOnly: true,
          metadata: { decision: ParoleCommissionDecision.PAROLE_DENIED },
        }),
        expect.objectContaining({
          eventType: TimelineEventType.CASE_CLOSED,
          metadata: { closedSubStage: ApplicationSubStage.PLAN_REJECTED },
        }),
      ]),
    );
  });

  it("closes the case and cancels the selected provider when parole is denied in Approvals", async () => {
    const { application, providerApplications } =
      await seedApprovalsStageApplication(testPrismaClient, {
        homePlan: {
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        },
      });

    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_DENIED),
    ).resolves.toMatchObject({ stage: ApplicationStage.CLOSED });

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.PLAN_REJECTED,
      status: ApplicationStatus.DONE,
      closedOutcome: ClosedOutcome.RELEASE_DENIED,
    });
    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
    });

    const eventTypes = (
      await readTimelineEvents(testPrismaClient, application.id)
    ).map(({ eventType }) => eventType);
    expect(eventTypes).toEqual(
      expect.arrayContaining([
        TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED,
        TimelineEventType.CASE_CLOSED,
      ]),
    );
    expect(eventTypes).not.toContain(
      TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED,
    );
  });

  it("lets a saved decision change, and a later denial still closes the case", async () => {
    const { application } =
      await seedApprovalsStageApplication(testPrismaClient);

    await setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED);
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.APPROVALS,
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
    });

    await setDecision(application.id, ParoleCommissionDecision.PAROLE_DENIED);
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      closedOutcome: ClosedOutcome.RELEASE_DENIED,
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_DENIED,
    });

    const recorded = (
      await readTimelineEvents(testPrismaClient, application.id)
    ).filter(
      ({ eventType }) =>
        eventType === TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED,
    );
    expect(recorded).toHaveLength(2);
  });

  it("records nothing new when the same decision is resent", async () => {
    const { application } =
      await seedApprovalsStageApplication(testPrismaClient);

    await setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED);
    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED),
    ).resolves.toMatchObject({ stage: ApplicationStage.APPROVALS });

    const recorded = (
      await readTimelineEvents(testPrismaClient, application.id)
    ).filter(
      ({ eventType }) =>
        eventType === TimelineEventType.PAROLE_COMMISSION_DECISION_RECORDED,
    );
    expect(recorded).toHaveLength(1);
  });

  it("advances to Release only once the home plan investigation is in", async () => {
    const { application, providerApplications } =
      await seedApprovalsStageApplication(testPrismaClient, {
        homePlan: {
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        },
      });

    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED),
    ).resolves.toMatchObject({ stage: ApplicationStage.RELEASE });

    await expect(
      readProviderApplication(testPrismaClient, providerApplications[0].id),
    ).resolves.toMatchObject({ stage: ApplicationStage.RELEASE });

    const events = await readTimelineEvents(testPrismaClient, application.id);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: TimelineEventType.APPROVALS_HOUSING_PLAN_APPROVED,
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

  it("rejects a Rider case", async () => {
    const { application } = await seedApprovalsStageApplication(
      testPrismaClient,
      { legalCurrentStatus: "Rider" },
    );

    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: RELEASE_FLOW_BAD_REQUEST.PAROLE_DECISION_NOT_FOR_RIDER,
    });
  });

  it.each([
    ApplicationStage.DRAFT,
    ApplicationStage.RELEASE,
    ApplicationStage.CLOSED,
  ])("rejects a case in %s", async (stage) => {
    const { application } =
      stage === ApplicationStage.RELEASE
        ? await seedReleaseStageApplication(testPrismaClient)
        : await seedHomePlanApplication(testPrismaClient, { stage });

    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_DENIED),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: RELEASE_FLOW_BAD_REQUEST.PAROLE_DECISION_STAGE,
    });
  });

  it("does not let another staff member record the decision", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient, {
      staffPseudonymizedId: "some-other-staff",
    });

    await expect(
      setDecision(application.id, ParoleCommissionDecision.PAROLE_GRANTED),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ paroleCommissionDecision: null });
  });

  it("rejects unexpected input keys", async () => {
    const { application } = await seedHomePlanApplication(testPrismaClient);

    await expect(
      staffCaller().housingApplication.setParoleCommissionDecision({
        applicationId: application.id,
        decision: ParoleCommissionDecision.PAROLE_GRANTED,
        // @ts-expect-error -- the input is .strict()
        stage: ApplicationStage.RELEASE,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
