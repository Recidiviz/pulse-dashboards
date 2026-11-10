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
  ApplicationSubStage,
  HomePlanInvestigationResult,
  ParoleCommissionDecision,
  ReleaseDecision,
  type ReleaseTaskType,
  TaskCompletedByRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import {
  businessToday,
  HOME_PLAN_ADDRESS_MAX_LENGTH,
  RELEASE_TASK_DETAILS,
  RELEASE_TASK_NOTE_MAX_LENGTH,
} from "~@idaho-th/shared";
import {
  providerCaller,
  staffCaller,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import { seedProviderUserWithHousingProviders } from "~@idaho-th/trpc/test/factories";
import { readTimelineEvents } from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { HOME_PLAN_BAD_REQUEST } from "../homePlan.helpers";
import {
  CONDITIONALLY_APPROVED_PROVIDER,
  seedActiveHousingProvider,
  seedApprovalsStageApplication,
  seedHomePlanApplication,
  seedReleaseStageApplication,
  TEST_HOME_PLAN_ADDRESS,
  TEST_HOUSING_PROVIDER_NAME,
} from "./homePlan.fixtures";

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

/** A `yyyy-MM-dd` day relative to today in the business timezone. */
function businessDayFromToday(days: number): string {
  const day = new Date(`${businessToday()}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

async function seedProviderReleaseApplication() {
  const housingProvider = await seedActiveHousingProvider(testPrismaClient);
  return seedReleaseStageApplication(testPrismaClient, {
    providerId: housingProvider.id,
  });
}

function setBedAvailableDate(applicationId: string, date: string | null) {
  return providerCaller().housingApplication.updateProviderHomePlanReleaseTaskDetail(
    { applicationId, taskType: "BED_CONFIRMED", type: "date", date },
  );
}

function toggleBedConfirmed(applicationId: string, completed: boolean) {
  return providerCaller().housingApplication.toggleProviderHomePlanReleaseTask({
    applicationId,
    taskType: "BED_CONFIRMED",
    completed,
  });
}

async function countReleaseTaskEvents(applicationId: string) {
  const events = await readTimelineEvents(testPrismaClient, applicationId);
  return events.filter(
    (event) => event.eventType === TimelineEventType.RELEASE_TASK_UPDATED,
  ).length;
}

/**
 * One person managing two organizations. They must name the one they are
 * acting as, so every read below is explicit about which queue it is in.
 */
async function seedTwoHousingProviders() {
  const { housingProviders } = await seedProviderUserWithHousingProviders(
    testPrismaClient,
    {
      housingProviders: [
        { name: TEST_HOUSING_PROVIDER_NAME },
        { name: "Second Chance Housing" },
      ],
    },
  );
  const [acting, other] = housingProviders;
  return { acting, other };
}

describe("homePlanRouter", () => {
  describe("input validation", () => {
    it("rejects a blank manual address", async () => {
      await expect(
        staffCaller().housingApplication.setManualAddressHomePlan({
          applicationId: "any-app-id",
          address: "",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a manual address over the max length", async () => {
      await expect(
        staffCaller().housingApplication.setManualAddressHomePlan({
          applicationId: "any-app-id",
          address: "a".repeat(HOME_PLAN_ADDRESS_MAX_LENGTH + 1),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects an approvals call carrying neither decision", async () => {
      await expect(
        staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: "any-app-id",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a release decision outside the enum", async () => {
      await expect(
        staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: "any-app-id",
          // @ts-expect-error deliberately invalid enum value
          releaseDecision: "NOT_A_DECISION",
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a release task type outside the enum", async () => {
      await expect(
        staffCaller().housingApplication.toggleStaffHomePlanReleaseTask({
          applicationId: "any-app-id",
          // @ts-expect-error deliberately invalid enum value
          taskType: "NOT_A_TASK",
          completed: true,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("rejects a release task note over the max length", async () => {
      await expect(
        staffCaller().housingApplication.updateHomePlanReleaseTaskDetail({
          applicationId: "any-app-id",
          taskType: "TRANSPORTATION_SECURED",
          type: "text",
          note: "a".repeat(RELEASE_TASK_NOTE_MAX_LENGTH + 1),
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  describe("getStaffHomePlan", () => {
    it("returns the empty home plan state for the owning staff member", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient);

      const result = await staffCaller().housingApplication.getStaffHomePlan({
        applicationId: application.id,
      });

      expect(result.homePlan).toBeNull();
      expect(result.permissions.canSetHomePlan).toBe(true);
    });

    it("does not expose an application owned by another staff member", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
      });

      await expect(
        staffCaller().housingApplication.getStaffHomePlan({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("getProviderHomePlan", () => {
    it("returns the home plan for the provider the caller is acting as", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { application } = await seedApprovalsStageApplication(
        testPrismaClient,
        { providerId: housingProvider.id },
      );

      const result =
        await providerCaller().housingApplication.getProviderHomePlan({
          applicationId: application.id,
        });

      expect(result.permissions.isSelectedProvider).toBe(true);
      expect(result.homePlan?.provider?.providerId).toBe(housingProvider.id);
    });

    it("does not expose an application matched to another provider", async () => {
      await seedActiveHousingProvider(testPrismaClient);
      // No `providerId`, so the fixture seeds an organization of its own.
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        providers: [{ name: "Second Chance Housing" }],
      });

      await expect(
        providerCaller().housingApplication.getProviderHomePlan({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("does not expose the other provider's home plan to a person managing both", async () => {
      const { acting, other } = await seedTwoHousingProviders();
      const { application } = await seedApprovalsStageApplication(
        testPrismaClient,
        { providerId: other.id },
      );

      await expect(
        providerCaller({
          requestedProviderId: acting.id,
        }).housingApplication.getProviderHomePlan({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("acceptProviderAsHomePlan", () => {
    it("sets the provider as the home plan and advances to approvals", async () => {
      const {
        application,
        providers: [provider],
      } = await seedHomePlanApplication(testPrismaClient, {
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      });

      const result =
        await staffCaller().housingApplication.acceptProviderAsHomePlan({
          applicationId: application.id,
          providerId: provider.id,
        });

      expect(result.stage).toBe(ApplicationStage.APPROVALS);

      await expect(readHomePlan(application.id)).resolves.toMatchObject({
        selectedProviderId: provider.id,
        createdByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      });
    });

    it("does not let another staff member accept a provider on this application", async () => {
      const {
        application,
        providers: [provider],
      } = await seedHomePlanApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      });

      await expect(
        staffCaller().housingApplication.acceptProviderAsHomePlan({
          applicationId: application.id,
          providerId: provider.id,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("setManualAddressHomePlan", () => {
    it("creates a manual-address home plan and closes the case", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
      });

      const result =
        await staffCaller().housingApplication.setManualAddressHomePlan({
          applicationId: application.id,
          address: TEST_HOME_PLAN_ADDRESS,
        });

      expect(result.homePlan?.address).toBe(TEST_HOME_PLAN_ADDRESS);
      expect(result.stage).toBe(ApplicationStage.CLOSED);

      await expect(readHomePlan(application.id)).resolves.toMatchObject({
        address: TEST_HOME_PLAN_ADDRESS,
        createdByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      });
    });

    it("does not let another staff member set the address on this application", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
      });

      await expect(
        staffCaller().housingApplication.setManualAddressHomePlan({
          applicationId: application.id,
          address: TEST_HOME_PLAN_ADDRESS,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("setHomePlanApprovals", () => {
    it("records a Rider's two decisions and advances to release", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { application } = await seedApprovalsStageApplication(
        testPrismaClient,
        { providerId: housingProvider.id, legalCurrentStatus: "Rider" },
      );

      const result =
        await staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: application.id,
          releaseDecision: ReleaseDecision.PROBATION_GRANTED,
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        });

      expect(result.stage).toBe(ApplicationStage.RELEASE);

      await expect(readHomePlan(application.id)).resolves.toMatchObject({
        releaseDecision: ReleaseDecision.PROBATION_GRANTED,
        homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        approvalsByStaffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      });
    });

    it("advances a Termer once the investigation joins the stored parole decision", async () => {
      const { application } = await seedApprovalsStageApplication(
        testPrismaClient,
        { paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED },
      );

      const result =
        await staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: application.id,
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        });

      expect(result.stage).toBe(ApplicationStage.RELEASE);
    });

    it("keeps a Termer waiting when only the investigation is in", async () => {
      const { application } =
        await seedApprovalsStageApplication(testPrismaClient);

      const result =
        await staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: application.id,
          homePlanInvestigation: HomePlanInvestigationResult.NOT_APPLICABLE,
        });

      expect(result.stage).toBe(ApplicationStage.APPROVALS);
    });

    it("rejects a release decision on a Termer case", async () => {
      const { application } =
        await seedApprovalsStageApplication(testPrismaClient);

      await expect(
        staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: application.id,
          releaseDecision: ReleaseDecision.PROBATION_GRANTED,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_DECISION_RIDER_ONLY,
      });
    });

    it("rejects a not-applicable investigation on a Rider case", async () => {
      const { application } = await seedApprovalsStageApplication(
        testPrismaClient,
        { legalCurrentStatus: "Rider" },
      );

      await expect(
        staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: application.id,
          homePlanInvestigation: HomePlanInvestigationResult.NOT_APPLICABLE,
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.INVESTIGATION_NOT_APPLICABLE_NOT_ALLOWED,
      });
    });

    it("does not let another staff member record the approvals", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
        stage: ApplicationStage.APPROVALS,
        providers: [CONDITIONALLY_APPROVED_PROVIDER],
        homePlan: {},
      });

      await expect(
        staffCaller().housingApplication.setHomePlanApprovals({
          applicationId: application.id,
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("toggleStaffHomePlanReleaseTask", () => {
    it("completes a release task and persists who completed it", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { application } = await seedReleaseStageApplication(
        testPrismaClient,
        { providerId: housingProvider.id },
      );

      const result =
        await staffCaller().housingApplication.toggleStaffHomePlanReleaseTask({
          applicationId: application.id,
          taskType: "HOUSING_DATE_REQUESTED",
          completed: true,
        });

      expect(
        result.releaseTasks?.tasks.find(
          (task) => task.taskType === "HOUSING_DATE_REQUESTED",
        )?.completed,
      ).toBe(true);

      await expect(
        readReleaseTask(application.id, "HOUSING_DATE_REQUESTED"),
      ).resolves.toMatchObject({
        completed: true,
        completedByRole: TaskCompletedByRole.STAFF,
        completedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      });
    });

    it("does not let another staff member toggle a task on this application", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
        stage: ApplicationStage.RELEASE,
        providers: [
          {
            ...CONDITIONALLY_APPROVED_PROVIDER,
            stage: ApplicationStage.RELEASE,
            subStage: ApplicationSubStage.SELECTED,
          },
        ],
        homePlan: {
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        },
      });

      await expect(
        staffCaller().housingApplication.toggleStaffHomePlanReleaseTask({
          applicationId: application.id,
          taskType: "HOUSING_DATE_REQUESTED",
          completed: true,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("toggleProviderHomePlanReleaseTask", () => {
    it("completes a release task and records the person who completed it", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { application } = await seedReleaseStageApplication(
        testPrismaClient,
        { providerId: housingProvider.id },
      );

      const result =
        await providerCaller().housingApplication.toggleProviderHomePlanReleaseTask(
          {
            applicationId: application.id,
            taskType: "FUNDING_SECURED",
            completed: true,
          },
        );

      expect(result.permissions.isSelectedProvider).toBe(true);

      // Scoping is organization-wide; the completer is still the person.
      await expect(
        readReleaseTask(application.id, "FUNDING_SECURED"),
      ).resolves.toMatchObject({
        completed: true,
        completedByRole: TaskCompletedByRole.PROVIDER,
        completedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      });
    });

    it("does not let a provider at another provider toggle its tasks", async () => {
      await seedActiveHousingProvider(testPrismaClient);
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        stage: ApplicationStage.RELEASE,
        providers: [
          {
            name: "Second Chance Housing",
            stage: ApplicationStage.RELEASE,
            subStage: ApplicationSubStage.SELECTED,
          },
        ],
        homePlan: {
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        },
      });

      await expect(
        providerCaller().housingApplication.toggleProviderHomePlanReleaseTask({
          applicationId: application.id,
          taskType: "FUNDING_SECURED",
          completed: true,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        readReleaseTask(application.id, "FUNDING_SECURED"),
      ).resolves.toMatchObject({ completed: false });
    });

    it("does not let a person managing both providers toggle the other one's task", async () => {
      const { acting, other } = await seedTwoHousingProviders();
      const { application } = await seedReleaseStageApplication(
        testPrismaClient,
        { providerId: other.id },
      );

      await expect(
        providerCaller({
          requestedProviderId: acting.id,
        }).housingApplication.toggleProviderHomePlanReleaseTask({
          applicationId: application.id,
          taskType: "FUNDING_SECURED",
          completed: true,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        readReleaseTask(application.id, "FUNDING_SECURED"),
      ).resolves.toMatchObject({ completed: false });
    });
  });

  describe("updateHomePlanReleaseTaskDetail", () => {
    it("persists the note for the owning staff member", async () => {
      const housingProvider = await seedActiveHousingProvider(testPrismaClient);
      const { application } = await seedReleaseStageApplication(
        testPrismaClient,
        { providerId: housingProvider.id },
      );

      await staffCaller().housingApplication.updateHomePlanReleaseTaskDetail({
        applicationId: application.id,
        taskType: "TRANSPORTATION_SECURED",
        type: "text",
        note: "  Bus  ",
      });

      await expect(
        readReleaseTask(application.id, "TRANSPORTATION_SECURED"),
      ).resolves.toMatchObject({ note: "Bus" });
    });

    it("does not let another staff member set the note on this application", async () => {
      const { application } = await seedHomePlanApplication(testPrismaClient, {
        staffPseudonymizedId: "some-other-staff",
        stage: ApplicationStage.RELEASE,
        providers: [
          {
            ...CONDITIONALLY_APPROVED_PROVIDER,
            stage: ApplicationStage.RELEASE,
            subStage: ApplicationSubStage.SELECTED,
          },
        ],
        homePlan: {
          homePlanInvestigation: HomePlanInvestigationResult.APPROVED,
        },
      });

      await expect(
        staffCaller().housingApplication.updateHomePlanReleaseTaskDetail({
          applicationId: application.id,
          taskType: "TRANSPORTATION_SECURED",
          type: "text",
          note: "Bus",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("bed available date", () => {
    it("saves and clears the date for the owning provider, without a timeline event", async () => {
      const { application } = await seedProviderReleaseApplication();
      const day = businessDayFromToday(10);

      const saved = await setBedAvailableDate(application.id, day);

      expect(
        saved.releaseTasks?.tasks.find(
          (task) => task.taskType === "BED_CONFIRMED",
        )?.date,
      ).toEqual(new Date(`${day}T00:00:00Z`));
      await expect(
        readReleaseTask(application.id, "BED_CONFIRMED"),
      ).resolves.toMatchObject({
        date: new Date(`${day}T00:00:00Z`),
        completed: false,
      });

      const cleared = await setBedAvailableDate(application.id, null);

      expect(
        cleared.releaseTasks?.tasks.find(
          (task) => task.taskType === "BED_CONFIRMED",
        )?.date,
      ).toBeNull();
      await expect(countReleaseTaskEvents(application.id)).resolves.toBe(0);
    });

    it.each([
      ["today", 0],
      ["a past date", -30],
    ])("accepts %s", async (_label, offset) => {
      const { application } = await seedProviderReleaseApplication();
      const day = businessDayFromToday(offset);

      await setBedAvailableDate(application.id, day);

      await expect(
        readReleaseTask(application.id, "BED_CONFIRMED"),
      ).resolves.toMatchObject({ date: new Date(`${day}T00:00:00Z`) });
    });

    it.each([
      ["a malformed date", { type: "date", date: "2026-02-31" }],
      ["a note on a date task", { type: "text", note: "Bed 4" }],
    ])("rejects %s", async (_label, detail) => {
      await seedActiveHousingProvider(testPrismaClient);
      await expect(
        providerCaller().housingApplication.updateProviderHomePlanReleaseTaskDetail(
          // @ts-expect-error the cases cover both union members
          { applicationId: "any-app-id", taskType: "BED_CONFIRMED", ...detail },
        ),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it.each(["TRANSPORTATION_INSTRUCTIONS", "FUNDING_SECURED"] as const)(
      "rejects a date on %s, which has no date detail",
      async (taskType) => {
        await seedActiveHousingProvider(testPrismaClient);
        await expect(
          providerCaller().housingApplication.updateProviderHomePlanReleaseTaskDetail(
            {
              applicationId: "any-app-id",
              taskType,
              type: "date",
              date: businessDayFromToday(1),
            },
          ),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      },
    );

    it("does not let a case manager write the provider's date", async () => {
      const { application } = await seedProviderReleaseApplication();

      await expect(
        staffCaller().housingApplication.updateHomePlanReleaseTaskDetail({
          applicationId: application.id,
          taskType: "BED_CONFIRMED",
          type: "date",
          date: businessDayFromToday(1),
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_OWNED_BY_PROVIDER,
      });
      await expect(
        readReleaseTask(application.id, "BED_CONFIRMED"),
      ).resolves.toMatchObject({ date: null });
    });

    it("keeps the date and the checkbox independent while the date is optional", async () => {
      const { application } = await seedProviderReleaseApplication();
      await toggleBedConfirmed(application.id, true);
      await setBedAvailableDate(application.id, businessDayFromToday(3));

      await setBedAvailableDate(application.id, null);

      await expect(
        readReleaseTask(application.id, "BED_CONFIRMED"),
      ).resolves.toMatchObject({ completed: true, date: null });
    });

    describe("when the date is required", () => {
      const bedDetail = RELEASE_TASK_DETAILS.BED_CONFIRMED;
      if (!bedDetail) throw new Error("BED_CONFIRMED has no detail definition");

      beforeEach(() => {
        bedDetail.required = true;
      });

      afterEach(() => {
        bedDetail.required = false;
      });

      it("refuses to complete the task without a date", async () => {
        const { application } = await seedProviderReleaseApplication();

        await expect(
          toggleBedConfirmed(application.id, true),
        ).rejects.toMatchObject({
          code: "BAD_REQUEST",
          message: HOME_PLAN_BAD_REQUEST.RELEASE_TASK_DETAIL_REQUIRED,
        });
        await expect(
          readReleaseTask(application.id, "BED_CONFIRMED"),
        ).resolves.toMatchObject({ completed: false });
      });

      it("unchecks a completed task when its date is cleared, like a manual uncheck", async () => {
        const { application } = await seedProviderReleaseApplication();
        await setBedAvailableDate(application.id, businessDayFromToday(3));
        await toggleBedConfirmed(application.id, true);

        await setBedAvailableDate(application.id, null);

        await expect(
          readReleaseTask(application.id, "BED_CONFIRMED"),
        ).resolves.toMatchObject({
          completed: false,
          completedAt: null,
          completedByRole: null,
          completedByPseudonymizedId: null,
          date: null,
        });
        // One event for the check, one for the automatic uncheck.
        await expect(countReleaseTaskEvents(application.id)).resolves.toBe(2);
      });

      it("always lets the owner uncheck the task", async () => {
        const { application } = await seedProviderReleaseApplication();
        await testPrismaClient.housingApplicationReleaseTask.updateMany({
          where: {
            homePlan: { applicationId: application.id },
            taskType: "BED_CONFIRMED",
          },
          data: { completed: true },
        });

        await toggleBedConfirmed(application.id, false);

        await expect(
          readReleaseTask(application.id, "BED_CONFIRMED"),
        ).resolves.toMatchObject({ completed: false });
      });
    });
  });
});
