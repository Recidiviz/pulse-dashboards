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
  ClosedOutcome,
} from "~@idaho-th/prisma/client";
import { RELEASE_DATE_IN_PAST_ERROR } from "~@idaho-th/shared";
import { STAFF_APPLICATION_NOT_FOUND } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.constants";
import { staffCaller } from "~@idaho-th/trpc/test/caller";
import {
  createEligibleHousingProvider,
  createHousingProvider,
  createHousingProviderLocation,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  seedStaffApplication,
  TEST_APPLICATION_FORM_DATA,
} from "./staffApplication.fixtures";

function seedOtherStaffApplication(
  overrides: Parameters<typeof seedStaffApplication>[1] = {},
) {
  return seedStaffApplication(testPrismaClient, {
    staffPseudonymizedId: "some-other-staff",
    ...overrides,
  });
}

describe("staffApplicationRouter", () => {
  describe("create", () => {
    it("persists a new application owned by the calling staff member", async () => {
      const result = await staffCaller().housingApplication.create({
        formData: TEST_APPLICATION_FORM_DATA,
      });

      const staffApplication = await readStaffApplication(
        testPrismaClient,
        result.id,
      );
      expect(staffApplication).toMatchObject({
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        stage: ApplicationStage.APPLICATION,
      });
    });
  });

  describe("update", () => {
    it("persists a field change for the owning staff member", async () => {
      const { application } = await seedStaffApplication(testPrismaClient);

      await staffCaller().housingApplication.update({
        id: application.id,
        data: { clientName: "New Name" },
      });

      const updated = await readHousingApplication(
        testPrismaClient,
        application.id,
      );
      expect(updated.clientName).toBe("New Name");
    });

    it("resolves null and writes nothing for another staff member's application", async () => {
      const { application } = await seedOtherStaffApplication();

      await expect(
        staffCaller().housingApplication.update({
          id: application.id,
          data: { clientName: "New Name" },
        }),
      ).resolves.toBeNull();

      const untouched = await readHousingApplication(
        testPrismaClient,
        application.id,
      );
      expect(untouched.clientName).toBe(
        TEST_APPLICATION_FORM_DATA.clientFullName,
      );
    });

    describe("release dates in the past", () => {
      /**
       * 10:30pm Mountain on 2026-09-10, which is already 2026-09-11 in UTC.
       * A server that compared against its own UTC clock would refuse
       * BUSINESS_TODAY here — the roughly six-hour window this rule is
       * deliberately built to survive.
       */
      const FROZEN_NOW = new Date("2026-09-11T04:30:00Z");
      const YESTERDAY = "2026-09-09";
      const BUSINESS_TODAY = "2026-09-10";
      // Exactly 7 days before BUSINESS_TODAY — the last day still inside the
      // grace period a release date may be moved into.
      const EDGE_OF_GRACE_PERIOD_DAY = "2026-09-03";
      // One day further back than EDGE_OF_GRACE_PERIOD_DAY — outside the
      // grace period, so still rejected.
      const BEYOND_GRACE_PERIOD_DAY = "2026-09-02";
      const FUTURE_DAY = "2026-12-01";

      beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(FROZEN_NOW);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      const formDataWithReleaseDate = (releaseDate: string) => ({
        ...TEST_APPLICATION_FORM_DATA,
        tpdHousingNeededDate: releaseDate,
      });

      it("rejects a release date more than 7 days in the past and writes nothing", async () => {
        const { application } = await seedStaffApplication(testPrismaClient);

        await expect(
          staffCaller().housingApplication.update({
            id: application.id,
            data: { expectedReleaseDate: BEYOND_GRACE_PERIOD_DAY },
          }),
        ).rejects.toThrow(RELEASE_DATE_IN_PAST_ERROR);

        const untouched = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(untouched.expectedReleaseDate).toEqual(
          application.expectedReleaseDate,
        );
      });

      it("accepts a release date within the 7-day grace period", async () => {
        const { application } = await seedStaffApplication(testPrismaClient);

        await staffCaller().housingApplication.update({
          id: application.id,
          data: { expectedReleaseDate: YESTERDAY },
        });

        const updated = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(updated.expectedReleaseDate).toEqual(
          new Date(`${YESTERDAY}T00:00:00.000Z`),
        );
      });

      it("accepts a release date exactly on the edge of the grace period", async () => {
        const { application } = await seedStaffApplication(testPrismaClient);

        await staffCaller().housingApplication.update({
          id: application.id,
          data: { expectedReleaseDate: EDGE_OF_GRACE_PERIOD_DAY },
        });

        const updated = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(updated.expectedReleaseDate).toEqual(
          new Date(`${EDGE_OF_GRACE_PERIOD_DAY}T00:00:00.000Z`),
        );
      });

      /**
       * An application digitized from paper carries a release date that has
       * already passed. Echoing that stored date back while editing something
       * else is not a move, so it must not be refused — otherwise the record
       * becomes uneditable the day its date falls behind.
       */
      const seedWithPastReleaseDate = async (releaseDay: string) => {
        const { application } = await seedStaffApplication(testPrismaClient);
        return testPrismaClient.housingApplication.update({
          where: { id: application.id },
          data: {
            expectedReleaseDate: new Date(`${releaseDay}T00:00:00.000Z`),
          },
        });
      };

      it("accepts the stored past date resubmitted unchanged", async () => {
        const application = await seedWithPastReleaseDate(
          BEYOND_GRACE_PERIOD_DAY,
        );

        await staffCaller().housingApplication.update({
          id: application.id,
          data: {
            expectedReleaseDate: BEYOND_GRACE_PERIOD_DAY,
            clientName: "Jane Doe",
          },
        });

        const updated = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(updated.expectedReleaseDate).toEqual(
          application.expectedReleaseDate,
        );
        expect(updated.clientName).toBe("Jane Doe");
      });

      it("still rejects moving a past date to a different past day beyond the grace period", async () => {
        const application = await seedWithPastReleaseDate(
          BEYOND_GRACE_PERIOD_DAY,
        );

        await expect(
          staffCaller().housingApplication.update({
            id: application.id,
            data: { expectedReleaseDate: "2026-08-25" },
          }),
        ).rejects.toThrow(RELEASE_DATE_IN_PAST_ERROR);

        const untouched = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(untouched.expectedReleaseDate).toEqual(
          application.expectedReleaseDate,
        );
      });

      it("rejects a release date more than 7 days in the past hidden in the form data", async () => {
        const { application } = await seedStaffApplication(testPrismaClient);

        await expect(
          staffCaller().housingApplication.update({
            id: application.id,
            data: {
              expectedReleaseDate: FUTURE_DAY,
              formData: formDataWithReleaseDate(BEYOND_GRACE_PERIOD_DAY),
            },
          }),
        ).rejects.toThrow(RELEASE_DATE_IN_PAST_ERROR);

        const untouched = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(untouched.expectedReleaseDate).toEqual(
          application.expectedReleaseDate,
        );
      });

      it("accepts a stored past release date resubmitted unchanged", async () => {
        const { application } = await seedStaffApplication(testPrismaClient, {
          formData: formDataWithReleaseDate(BEYOND_GRACE_PERIOD_DAY),
        });

        await staffCaller().housingApplication.update({
          id: application.id,
          data: {
            formData: {
              ...formDataWithReleaseDate(BEYOND_GRACE_PERIOD_DAY),
              clientFullName: "John Doe",
            },
          },
        });

        const updated = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(updated.formData).toMatchObject({
          tpdHousingNeededDate: BEYOND_GRACE_PERIOD_DAY,
          clientFullName: "John Doe",
        });
      });

      it("accepts today, measured in the business timezone", async () => {
        const { application } = await seedStaffApplication(testPrismaClient);

        await staffCaller().housingApplication.update({
          id: application.id,
          data: {
            expectedReleaseDate: BUSINESS_TODAY,
            formData: formDataWithReleaseDate(BUSINESS_TODAY),
          },
        });

        const updated = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(updated.expectedReleaseDate).toEqual(
          new Date("2026-09-10T00:00:00.000Z"),
        );
      });

      it("accepts and persists a future date", async () => {
        const { application } = await seedStaffApplication(testPrismaClient);

        await staffCaller().housingApplication.update({
          id: application.id,
          data: {
            expectedReleaseDate: FUTURE_DAY,
            formData: formDataWithReleaseDate(FUTURE_DAY),
          },
        });

        const updated = await readHousingApplication(
          testPrismaClient,
          application.id,
        );
        expect(updated.expectedReleaseDate).toEqual(
          new Date("2026-12-01T00:00:00.000Z"),
        );
        expect(updated.formData).toMatchObject({
          tpdHousingNeededDate: FUTURE_DAY,
        });
      });
    });
  });

  describe("advanceStage", () => {
    describe("input validation", () => {
      it("rejects a closedOutcome when the target stage is not Closed", async () => {
        await expect(
          staffCaller().housingApplication.advanceStage({
            applicationId: "some-id",
            targetStage: ApplicationStage.APPROVALS,
            closedOutcome: ClosedOutcome.CLIENT_RELEASED,
          }),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      });

      it("rejects a closedOutcomeNote when the outcome is not Other", async () => {
        await expect(
          staffCaller().housingApplication.advanceStage({
            applicationId: "some-id",
            targetStage: ApplicationStage.CLOSED,
            closedOutcome: ClosedOutcome.CLIENT_RELEASED,
            closedOutcomeNote: "note",
          }),
        ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      });
    });

    it("advances the owning staff member's application", async () => {
      const { application } = await seedStaffApplication(testPrismaClient, {
        providerApplicationStages: [ApplicationStage.APPLICATION],
      });

      await staffCaller().housingApplication.advanceStage({
        applicationId: application.id,
        targetStage: ApplicationStage.CLOSED,
        closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
      });

      const staffApplication = await readStaffApplication(
        testPrismaClient,
        application.id,
      );
      expect(staffApplication.stage).toBe(ApplicationStage.CLOSED);
    });

    it("rejects advancing another staff member's application", async () => {
      const { application } = await seedOtherStaffApplication();

      await expect(
        staffCaller().housingApplication.advanceStage({
          applicationId: application.id,
          targetStage: ApplicationStage.CLOSED,
          closedOutcome: ClosedOutcome.APPLICATION_WITHDRAWN,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      });

      const staffApplication = await readStaffApplication(
        testPrismaClient,
        application.id,
      );
      expect(staffApplication.stage).toBe(ApplicationStage.APPLICATION);
    });
  });

  describe("delete", () => {
    it("deletes the owning staff member's application", async () => {
      const { application } = await seedStaffApplication(testPrismaClient);

      await expect(
        staffCaller().housingApplication.delete({ id: application.id }),
      ).resolves.toEqual({ count: 1 });

      expect(await testPrismaClient.housingApplication.count()).toBe(0);
    });

    it("resolves a no-op count and writes nothing for another staff member's application", async () => {
      const { application } = await seedOtherStaffApplication();

      await expect(
        staffCaller().housingApplication.delete({ id: application.id }),
      ).resolves.toEqual({ count: 0 });

      expect(await testPrismaClient.housingApplication.count()).toBe(1);
    });
  });

  describe("duplicate", () => {
    it("closes the original and creates a new open application for the owning staff member", async () => {
      const { application } = await seedStaffApplication(testPrismaClient);

      const result = await staffCaller().housingApplication.duplicate({
        applicationId: application.id,
      });

      expect(result.applicationId).not.toBe(application.id);
      expect(await testPrismaClient.housingApplication.count()).toBe(2);

      const original = await readStaffApplication(
        testPrismaClient,
        application.id,
      );
      expect(original.stage).toBe(ApplicationStage.CLOSED);

      const duplicate = await readStaffApplication(
        testPrismaClient,
        result.applicationId,
      );
      expect(duplicate).toMatchObject({
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
        stage: ApplicationStage.APPLICATION,
      });
    });

    it("rejects duplicating another staff member's application", async () => {
      const { application } = await seedOtherStaffApplication();

      await expect(
        staffCaller().housingApplication.duplicate({
          applicationId: application.id,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: STAFF_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      });

      expect(await testPrismaClient.housingApplication.count()).toBe(1);
      const original = await readStaffApplication(
        testPrismaClient,
        application.id,
      );
      expect(original.stage).not.toBe(ApplicationStage.CLOSED);
    });
  });

  describe("toggleEligibleProviderSelection", () => {
    async function seedEligibleProvider(applicationId: string) {
      const provider = await createHousingProvider(testPrismaClient);
      const providerLocation = await createHousingProviderLocation(
        testPrismaClient,
        { providerId: provider.id },
      );
      await createEligibleHousingProvider(testPrismaClient, {
        applicationId,
        providerId: provider.id,
        providerLocationId: providerLocation.id,
      });
      return provider;
    }

    it("toggles selection for the owning staff member", async () => {
      const { application } = await seedStaffApplication(testPrismaClient);
      const provider = await seedEligibleProvider(application.id);

      const result =
        await staffCaller().housingApplication.toggleEligibleProviderSelection({
          applicationId: application.id,
          providers: [{ providerId: provider.id, isSelected: false }],
        });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ isSelected: false });

      const row = await testPrismaClient.eligibleHousingProvider.findUnique({
        where: {
          applicationId_providerId: {
            applicationId: application.id,
            providerId: provider.id,
          },
        },
      });
      expect(row?.isSelected).toBe(false);
    });

    it("rejects toggling selection on another staff member's application", async () => {
      const { application } = await seedOtherStaffApplication();
      const provider = await seedEligibleProvider(application.id);

      await expect(
        staffCaller().housingApplication.toggleEligibleProviderSelection({
          applicationId: application.id,
          providers: [{ providerId: provider.id, isSelected: false }],
        }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message: "Not authorized to modify this application",
      });

      const row = await testPrismaClient.eligibleHousingProvider.findUnique({
        where: {
          applicationId_providerId: {
            applicationId: application.id,
            providerId: provider.id,
          },
        },
      });
      expect(row?.isSelected).toBe(true);
    });
  });
});

describe("acknowledgeApprovalRevoked", () => {
  function seedRevokedCase(
    overrides: Parameters<typeof seedStaffApplication>[1] = {},
  ) {
    return seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      status: ApplicationStatus.ACTION_NEEDED,
      ...overrides,
    });
  }

  it("marks a revoked case done without a timeline event", async () => {
    const { application } = await seedRevokedCase();

    await staffCaller().housingApplication.acknowledgeApprovalRevoked({
      applicationId: application.id,
    });

    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CONDITIONAL_APPROVAL_REVOKED,
      status: ApplicationStatus.DONE,
    });
    expect(await readTimelineEvents(testPrismaClient, application.id)).toEqual(
      [],
    );
  });

  it.each([
    { status: ApplicationStatus.DONE },
    { subStage: ApplicationSubStage.CANCELED },
    {
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
    },
  ])("refuses a case in any other state (%o)", async (overrides) => {
    const { application } = await seedRevokedCase(overrides);

    await expect(
      staffCaller().housingApplication.acknowledgeApprovalRevoked({
        applicationId: application.id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("refuses another staff member's case", async () => {
    const { application } = await seedRevokedCase({
      staffPseudonymizedId: "some-other-staff",
    });

    await expect(
      staffCaller().housingApplication.acknowledgeApprovalRevoked({
        applicationId: application.id,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      readStaffApplication(testPrismaClient, application.id),
    ).resolves.toMatchObject({ status: ApplicationStatus.ACTION_NEEDED });
  });
});
