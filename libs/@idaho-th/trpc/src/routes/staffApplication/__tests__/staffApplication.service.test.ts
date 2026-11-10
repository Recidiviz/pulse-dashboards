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
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  ParoleCommissionDecision,
  StateCode,
  TimelineActorRole,
  TimelineEventType,
} from "~@idaho-th/prisma/client";
import { extractEligibilityParams } from "~@idaho-th/shared";
import { STAFF_CASE_CLOSED_MESSAGE } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";
import { RELEASE_FLOW_BAD_REQUEST } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.constants";
import { updateHousingApplicationSchema } from "~@idaho-th/trpc/routes/staffApplication/staffApplication.schema";
import {
  createHousingApplication,
  deleteHousingApplication,
  updateHousingApplication,
} from "~@idaho-th/trpc/routes/staffApplication/staffApplication.service";
import {
  createHousingProvider,
  createHousingProviderLocation,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readPreferredProviderIds,
  readStaffApplication,
  readTimelineEvents,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import {
  seedStaffApplication,
  TEST_APPLICATION_FORM_DATA,
  TEST_ELIGIBILITY_PARAMS,
  TEST_PROVIDER_LOCATION,
  TEST_STORED_FORM_DATA,
} from "./staffApplication.fixtures";

describe("createHousingApplication", () => {
  test("derives eligibility params from the submitted form data", () => {
    expect(extractEligibilityParams(TEST_APPLICATION_FORM_DATA)).toEqual(
      TEST_ELIGIBILITY_PARAMS,
    );
  });

  test("records the initial APPLICATION_CREATED and STAGE_ADVANCED events", async () => {
    const application = await createHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        formData: TEST_APPLICATION_FORM_DATA,
      },
    );

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toIncludeSameMembers([
      expect.objectContaining({
        eventType: TimelineEventType.APPLICATION_CREATED,
        description: "Application created for client",
        actorRole: TimelineActorRole.STAFF,
        actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      }),
      expect.objectContaining({
        eventType: TimelineEventType.STAGE_ADVANCED,
        description: "Stage set to 'Application'",
        actorRole: TimelineActorRole.SYSTEM,
        metadata: {
          fromStage: ApplicationStage.APPLICATION,
          toStage: ApplicationStage.APPLICATION,
        },
      }),
    ]);
  });

  test("stores the form data, staff application, release date, and matched providers", async () => {
    const provider = await createHousingProvider(testPrismaClient, {
      name: "Acme Housing Partners (AHP)",
    });
    const providerLocation = await createHousingProviderLocation(
      testPrismaClient,
      { providerId: provider.id, ...TEST_PROVIDER_LOCATION },
    );

    const result = await createHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        formData: TEST_APPLICATION_FORM_DATA,
      },
    );

    expect(result).toMatchObject({
      stateCode: StateCode.US_ID,
      clientName: TEST_APPLICATION_FORM_DATA.clientFullName,
      idocNumber: TEST_APPLICATION_FORM_DATA.idocNumber,
      expectedReleaseDate: new Date(
        TEST_APPLICATION_FORM_DATA.tpdHousingNeededDate,
      ),
      formData: TEST_STORED_FORM_DATA,
    });
    expect(result.eligibleProviders).toHaveLength(1);
    expect(result.eligibleProviders[0]).toMatchObject({
      providerId: provider.id,
      providerLocationId: providerLocation.id,
    });

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      result.id,
    );
    expect(staffApplication).toMatchObject({
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      intakeStatus: ApplicationIntakeStatus.SUBMITTED,
      stage: ApplicationStage.APPLICATION,
      subStage: ApplicationSubStage.PROVIDER_REVIEW,
      status: ApplicationStatus.ACTION_NEEDED,
    });
  });

  test("creates no eligible providers when nothing matches the eligibility params", async () => {
    const provider = await createHousingProvider(testPrismaClient);
    await createHousingProviderLocation(testPrismaClient, {
      providerId: provider.id,
      ...TEST_PROVIDER_LOCATION,
      district: "D1",
    });

    const result = await createHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        formData: TEST_APPLICATION_FORM_DATA,
      },
    );

    expect(result.eligibleProviders).toHaveLength(0);
  });

  // The PreferredHousingProvider foreign key rejects the unknown id.
  test("rejects a preferred-provider id that does not correspond to a real provider", async () => {
    await expect(
      createHousingApplication(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        formData: {
          ...TEST_APPLICATION_FORM_DATA,
          preferredProviders: ["99999999-9999-4999-8999-999999999999"],
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("updateHousingApplication", () => {
  // The update path refuses a release date before today, so these cases would
  // otherwise start failing the day their literal dates fell into the past.
  // Freezing removes the wall-clock dependency rather than deferring it.
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("records an EXPECTED_RELEASE_DATE_UPDATED event when the release date is set", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { id: application.id, data: { expectedReleaseDate: "2026-08-15" } },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.expectedReleaseDate).toEqual(new Date("2026-08-15"));

    const timelineEvents = await readTimelineEvents(
      testPrismaClient,
      application.id,
    );
    expect(timelineEvents).toHaveLength(1);
    expect(timelineEvents[0]).toMatchObject({
      eventType: TimelineEventType.EXPECTED_RELEASE_DATE_UPDATED,
      description: "Release date changed to: 8/15/2026",
      actorRole: TimelineActorRole.STAFF,
      actorPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      scopedProviderId: null,
      cmOnly: false,
      metadata: { expectedReleaseDate: "2026-08-15" },
    });
  });

  test("syncs formData.tpdHousingNeededDate when only expectedReleaseDate is sent", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { id: application.id, data: { expectedReleaseDate: "2026-08-15" } },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.formData).toEqual({
      ...TEST_APPLICATION_FORM_DATA,
      tpdHousingNeededDate: "2026-08-15",
    });
  });

  test("clears formData.tpdHousingNeededDate when the release date is cleared", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { id: application.id, data: { expectedReleaseDate: null } },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(
      (updated.formData as Record<string, unknown>)["tpdHousingNeededDate"],
    ).toBeNull();
  });

  test("overwrites formData wholesale when provided alongside expectedReleaseDate", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);
    const changes = {
      clientFullName: "Jane Doe",
      tpdHousingNeededDate: "2026-08-15",
      legalCurrentStatus: null,
    };
    const formData = { ...TEST_APPLICATION_FORM_DATA, ...changes };

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        id: application.id,
        data: { expectedReleaseDate: "2026-08-15", formData },
      },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.formData).toEqual({ ...TEST_STORED_FORM_DATA, ...changes });
    expect(
      (updated.formData as Record<string, unknown>)["legalCurrentStatus"],
    ).toBeNull();
  });

  test("rejects a partial or malformed formData", () => {
    const result = updateHousingApplicationSchema.safeParse({
      id: "some-id",
      data: {
        formData: { clientFullName: "Jane Doe" },
      },
    });

    expect(result.success).toBe(false);
  });

  test.each([
    {
      name: "a Termer's Parole Commission Decision",
      seed: {
        formData: {
          ...TEST_APPLICATION_FORM_DATA,
          legalCurrentStatus: "Termer",
        },
        paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
      },
      nextStatus: "Rider",
    },
    {
      name: "a Rider's release decision",
      seed: { homePlan: "address", approvalsCleared: true },
      nextStatus: "Termer",
    },
  ] as const)(
    "rejects a Q6 cohort change once $name is saved",
    async ({ seed, nextStatus }) => {
      const { application } = await seedStaffApplication(
        testPrismaClient,
        seed,
      );

      await expect(
        updateHousingApplication(
          testPrismaClient,
          TEST_STAFF_PSEUDONYMIZED_ID,
          {
            id: application.id,
            data: {
              formData: {
                ...TEST_APPLICATION_FORM_DATA,
                legalCurrentStatus: nextStatus,
              },
            },
          },
        ),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: RELEASE_FLOW_BAD_REQUEST.CURRENT_STATUS_LOCKED,
      });
    },
  );

  test("allows a Termer to become a Parole Violator after a decision: the flow is the same", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      formData: { ...TEST_APPLICATION_FORM_DATA, legalCurrentStatus: "Termer" },
      paroleCommissionDecision: ParoleCommissionDecision.PAROLE_GRANTED,
    });

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        id: application.id,
        data: {
          formData: {
            ...TEST_APPLICATION_FORM_DATA,
            legalCurrentStatus: "Parole Violator",
          },
        },
      },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(
      (updated.formData as Record<string, unknown>)["legalCurrentStatus"],
    ).toBe("Parole Violator");
  });

  // Preferred providers are only rewritten when formData is part of the update.
  test("rejects a preferred-provider id that does not correspond to a real provider when formData is updated", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await expect(
      updateHousingApplication(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        id: application.id,
        data: {
          formData: {
            ...TEST_APPLICATION_FORM_DATA,
            preferredProviders: ["99999999-9999-4999-8999-999999999999"],
          },
        },
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("re-derives eligible providers when formData changes, preserving overrides", async () => {
    const staleProvider = await createHousingProvider(testPrismaClient);
    const staleLocation = await createHousingProviderLocation(
      testPrismaClient,
      { providerId: staleProvider.id, ...TEST_PROVIDER_LOCATION },
    );
    const freshProvider = await createHousingProvider(testPrismaClient);
    const freshLocation = await createHousingProviderLocation(
      testPrismaClient,
      {
        providerId: freshProvider.id,
        ...TEST_PROVIDER_LOCATION,
        district: "D4",
      },
    );
    const overrideProvider = await createHousingProvider(testPrismaClient);
    const overrideLocation = await createHousingProviderLocation(
      testPrismaClient,
      {
        providerId: overrideProvider.id,
        ...TEST_PROVIDER_LOCATION,
        district: "D9",
      },
    );

    const { application } = await seedStaffApplication(testPrismaClient);
    await testPrismaClient.eligibleHousingProvider.create({
      data: {
        applicationId: application.id,
        providerId: staleProvider.id,
        providerLocationId: staleLocation.id,
      },
    });
    await testPrismaClient.eligibleHousingProvider.create({
      data: {
        applicationId: application.id,
        providerId: overrideProvider.id,
        providerLocationId: overrideLocation.id,
        isSelected: true,
        isManualOverride: true,
        eligibilityOverrideNote: "Staff added despite district mismatch",
      },
    });

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        id: application.id,
        data: {
          formData: {
            ...TEST_APPLICATION_FORM_DATA,
            preferredDistrict: ["D4"],
          },
        },
      },
    );

    const eligibleProviders =
      await testPrismaClient.eligibleHousingProvider.findMany({
        where: { applicationId: application.id },
      });
    expect(eligibleProviders).toIncludeSameMembers([
      expect.objectContaining({
        providerId: freshProvider.id,
        providerLocationId: freshLocation.id,
        eligibilityOverrideNote: null,
      }),
      expect.objectContaining({
        providerId: overrideProvider.id,
        providerLocationId: overrideLocation.id,
        eligibilityOverrideNote: "Staff added despite district mismatch",
      }),
    ]);
  });

  test("preserves a manually added provider that carries no override note", async () => {
    const manualProvider = await createHousingProvider(testPrismaClient);
    const manualLocation = await createHousingProviderLocation(
      testPrismaClient,
      {
        providerId: manualProvider.id,
        ...TEST_PROVIDER_LOCATION,
        district: "D9",
      },
    );

    const { application } = await seedStaffApplication(testPrismaClient);
    await testPrismaClient.eligibleHousingProvider.create({
      data: {
        applicationId: application.id,
        providerId: manualProvider.id,
        providerLocationId: manualLocation.id,
        isSelected: true,
        isManualOverride: true,
        eligibilityOverrideNote: null,
      },
    });

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        id: application.id,
        data: {
          formData: {
            ...TEST_APPLICATION_FORM_DATA,
            preferredDistrict: ["D4"],
          },
        },
      },
    );

    const eligibleProviders =
      await testPrismaClient.eligibleHousingProvider.findMany({
        where: { applicationId: application.id },
      });
    expect(eligibleProviders).toIncludeAllMembers([
      expect.objectContaining({
        providerId: manualProvider.id,
        isManualOverride: true,
        eligibilityOverrideNote: null,
      }),
    ]);
  });

  test("preserves a staff selection on a re-derived provider that survives the update", async () => {
    const provider = await createHousingProvider(testPrismaClient);
    const location = await createHousingProviderLocation(testPrismaClient, {
      providerId: provider.id,
      ...TEST_PROVIDER_LOCATION,
    });

    const { application } = await seedStaffApplication(testPrismaClient);
    await testPrismaClient.eligibleHousingProvider.create({
      data: {
        applicationId: application.id,
        providerId: provider.id,
        providerLocationId: location.id,
        isSelected: true,
      },
    });

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        id: application.id,
        data: {
          formData: {
            ...TEST_APPLICATION_FORM_DATA,
            clientFullName: "Jane Doe Updated",
          },
        },
      },
    );

    const eligibleProviders =
      await testPrismaClient.eligibleHousingProvider.findMany({
        where: { applicationId: application.id },
      });
    expect(eligibleProviders).toIncludeSameMembers([
      expect.objectContaining({
        providerId: provider.id,
        providerLocationId: location.id,
        isSelected: true,
      }),
    ]);
  });

  test("does not record a timeline event when the release date is cleared", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { id: application.id, data: { expectedReleaseDate: null } },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.expectedReleaseDate).toBeNull();
    expect(
      await readTimelineEvents(testPrismaClient, application.id),
    ).toHaveLength(0);
  });

  test("does not record a timeline event when the release date is untouched", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await updateHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { id: application.id, data: { clientName: "New Name" } },
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.clientName).toBe("New Name");
    expect(
      await readTimelineEvents(testPrismaClient, application.id),
    ).toHaveLength(0);
  });

  test("rejects updates when the staff case is closed", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
    });

    await expect(
      updateHousingApplication(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        id: application.id,
        data: { expectedReleaseDate: "2026-08-15" },
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: STAFF_CASE_CLOSED_MESSAGE,
      } satisfies Partial<TRPCError>),
    );

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.expectedReleaseDate).toBeNull();
  });

  test("returns null and writes nothing for another staff member's application", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    const result = await updateHousingApplication(
      testPrismaClient,
      "some-other-staff",
      { id: application.id, data: { clientName: "New Name" } },
    );

    expect(result).toBeNull();
    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.clientName).toBe(TEST_APPLICATION_FORM_DATA.clientFullName);
  });
});

describe("deleteHousingApplication", () => {
  test("rejects deleting a closed staff case", async () => {
    const { application } = await seedStaffApplication(testPrismaClient, {
      stage: ApplicationStage.CLOSED,
      subStage: ApplicationSubStage.CANCELED,
      status: ApplicationStatus.DONE,
    });

    await expect(
      deleteHousingApplication(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        id: application.id,
      }),
    ).rejects.toThrow(
      expect.objectContaining({
        code: "BAD_REQUEST",
        message: STAFF_CASE_CLOSED_MESSAGE,
      } satisfies Partial<TRPCError>),
    );

    expect(await testPrismaClient.housingApplication.count()).toBe(1);
  });

  test("deletes an open case along with its staff application", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    const result = await deleteHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      { id: application.id },
    );

    expect(result).toEqual({ count: 1 });
    expect(await testPrismaClient.housingApplication.count()).toBe(0);
    expect(await testPrismaClient.staffHousingApplication.count()).toBe(0);
  });
});

describe("preferred providers", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("create stores them as ranked rows and keeps them out of formData", async () => {
    const first = await createHousingProvider(testPrismaClient);
    const second = await createHousingProvider(testPrismaClient);

    const result = await createHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        formData: {
          ...TEST_APPLICATION_FORM_DATA,
          preferredProviders: [second.id, first.id],
        },
      },
    );

    await expect(
      readPreferredProviderIds(testPrismaClient, result.id),
    ).resolves.toEqual([second.id, first.id]);
    const stored = await readHousingApplication(testPrismaClient, result.id);
    expect(stored.formData).not.toHaveProperty("preferredProviders");
  });

  test("update replaces the rows only when formData is part of the update", async () => {
    const first = await createHousingProvider(testPrismaClient);
    const second = await createHousingProvider(testPrismaClient);
    const { application } = await seedStaffApplication(testPrismaClient);
    const save = (
      data: Parameters<typeof updateHousingApplication>[2]["data"],
    ) =>
      updateHousingApplication(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        id: application.id,
        data,
      });

    await save({
      formData: {
        ...TEST_APPLICATION_FORM_DATA,
        preferredProviders: [first.id, second.id],
      },
    });
    await save({
      formData: {
        ...TEST_APPLICATION_FORM_DATA,
        preferredProviders: [second.id],
      },
    });
    await expect(
      readPreferredProviderIds(testPrismaClient, application.id),
    ).resolves.toEqual([second.id]);

    await save({ expectedReleaseDate: "2026-03-01" });
    await expect(
      readPreferredProviderIds(testPrismaClient, application.id),
    ).resolves.toEqual([second.id]);
  });

  // The original bug: a deleted provider's id stayed in formData and every
  // later save failed with BAD_REQUEST.
  test("deleting a provider drops its row and the next save succeeds", async () => {
    const kept = await createHousingProvider(testPrismaClient);
    const deleted = await createHousingProvider(testPrismaClient);
    const created = await createHousingApplication(
      testPrismaClient,
      TEST_STAFF_PSEUDONYMIZED_ID,
      {
        formData: {
          ...TEST_APPLICATION_FORM_DATA,
          preferredProviders: [deleted.id, kept.id],
        },
      },
    );

    await testPrismaClient.housingProvider.delete({
      where: { id: deleted.id },
    });

    await expect(
      readPreferredProviderIds(testPrismaClient, created.id),
    ).resolves.toEqual([kept.id]);
    await expect(
      updateHousingApplication(testPrismaClient, TEST_STAFF_PSEUDONYMIZED_ID, {
        id: created.id,
        data: {
          formData: {
            ...TEST_APPLICATION_FORM_DATA,
            preferredProviders: [kept.id],
          },
        },
      }),
    ).resolves.not.toBeNull();
  });
});
