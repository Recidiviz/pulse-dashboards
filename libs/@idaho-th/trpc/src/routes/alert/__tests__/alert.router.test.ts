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
  AlertType,
  ApplicationStage,
  ApplicationSubStage,
} from "~@idaho-th/prisma/client";
import { createAlerts } from "~@idaho-th/trpc/routes/alert/alert.helpers";
import {
  providerCaller,
  staffCaller,
  TEST_PROVIDER_PSEUDONYMIZED_ID,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import {
  createAlert,
  createEligibleHousingProvider,
  createHousingApplication,
  createHousingProviderLocation,
  createProviderHousingApplication,
  createStaffHousingApplication,
  seedProviderUserWithHousingProviders,
} from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

/** Matches an existing organization to the application at the given sub-stage. */
async function seedMatch(
  applicationId: string,
  providerId: string,
  subStage: ApplicationSubStage,
  stage: ApplicationStage = ApplicationStage.APPLICATION,
) {
  const location = await createHousingProviderLocation(testPrismaClient, {
    providerId,
  });
  return createProviderHousingApplication(testPrismaClient, {
    applicationId,
    providerId,
    providerLocationId: location.id,
    stage,
    subStage,
  });
}

describe("alerts", () => {
  // One person at two competing organizations, so each call names the one it
  // acts as.
  let providerA: { id: string };
  let providerB: { id: string };
  let providerC: { id: string };
  let applicationId: string;

  const asProviderA = () =>
    providerCaller({ requestedProviderId: providerA.id });
  const asProviderB = () =>
    providerCaller({ requestedProviderId: providerB.id });

  const readProviderAlerts = async (caller = asProviderA()) =>
    (
      await caller.housingApplication.getProviderApplicationById({
        applicationId,
      })
    ).alerts;

  const readStaffAlerts = async () =>
    (
      await staffCaller().housingApplication.getStaffApplicationById({
        applicationId,
      })
    ).alerts;

  beforeEach(async () => {
    const { housingProviders } = await seedProviderUserWithHousingProviders(
      testPrismaClient,
      {
        housingProviders: [
          { name: "Sunrise House" },
          { name: "Beta Housing" },
          { name: "Gamma Housing" },
        ],
      },
    );
    [providerA, providerB, providerC] = housingProviders;

    const application = await createHousingApplication(testPrismaClient);
    await createStaffHousingApplication(testPrismaClient, {
      applicationId: application.id,
    });
    applicationId = application.id;
  });

  describe("selecting a home plan", () => {
    beforeEach(async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.CONDITIONALLY_APPROVED,
      );
      await seedMatch(
        applicationId,
        providerB.id,
        ApplicationSubStage.CONDITIONALLY_APPROVED,
      );
    });

    const acceptProviderA = () =>
      staffCaller().housingApplication.acceptProviderAsHomePlan({
        applicationId,
        providerId: providerA.id,
      });

    it("alerts the selected organization", async () => {
      await acceptProviderA();

      await expect(readProviderAlerts()).resolves.toEqual([
        {
          id: expect.any(String),
          type: AlertType.SELECTED_AS_HOME_PLAN,
          metadata: null,
        },
      ]);
    });

    it("does not alert a competing organization", async () => {
      await acceptProviderA();

      await expect(readProviderAlerts(asProviderB())).resolves.toEqual([]);
    });

    it("does not alert the case manager", async () => {
      await acceptProviderA();

      await expect(readStaffAlerts()).resolves.toEqual([]);
    });
  });

  it("creates no alert when the selection is rejected", async () => {
    await seedMatch(
      applicationId,
      providerA.id,
      ApplicationSubStage.PROVIDER_REVIEW,
    );

    await expect(
      staffCaller().housingApplication.acceptProviderAsHomePlan({
        applicationId,
        providerId: providerA.id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(testPrismaClient.alert.count()).resolves.toBe(0);
  });

  it("hides a provider alert once its visible window has passed", async () => {
    await seedMatch(
      applicationId,
      providerA.id,
      ApplicationSubStage.PROVIDER_REVIEW,
    );
    await createAlert(testPrismaClient, {
      applicationId,
      providerId: providerA.id,
      createdAt: daysAgo(11),
    });
    const fresh = await createAlert(testPrismaClient, {
      applicationId,
      providerId: providerA.id,
      createdAt: daysAgo(9),
    });

    await expect(readProviderAlerts()).resolves.toEqual([
      { id: fresh.id, type: AlertType.SELECTED_AS_HOME_PLAN, metadata: null },
    ]);
  });

  it("hides alerts from an organization the case closed without", async () => {
    await seedMatch(
      applicationId,
      providerA.id,
      ApplicationSubStage.CANCELED,
      ApplicationStage.CLOSED,
    );
    await createAlert(testPrismaClient, {
      applicationId,
      providerId: providerA.id,
    });

    await expect(readProviderAlerts()).resolves.toEqual([]);
  });

  it("shows a staff alert only to the staff member it is addressed to", async () => {
    const own = await createAlert(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
    await createAlert(testPrismaClient, {
      applicationId,
      staffPseudonymizedId: "other-staff",
    });

    await expect(readStaffAlerts()).resolves.toEqual([
      { id: own.id, type: AlertType.SELECTED_AS_HOME_PLAN, metadata: null },
    ]);
  });

  describe("dismissProviderAlert", () => {
    let alertId: string;

    beforeEach(async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      await seedMatch(
        applicationId,
        providerB.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      ({ id: alertId } = await createAlert(testPrismaClient, {
        applicationId,
        providerId: providerA.id,
      }));
    });

    it("dismisses for the organization and records who dismissed it", async () => {
      await expect(
        asProviderA().housingApplication.dismissProviderAlert({
          alertId,
        }),
      ).resolves.toEqual({ dismissed: true });

      await expect(readProviderAlerts()).resolves.toEqual([]);
      await expect(
        testPrismaClient.alert.findUniqueOrThrow({
          where: { id: alertId },
        }),
      ).resolves.toMatchObject({
        dismissedAt: expect.any(Date),
        dismissedByPseudonymizedId: TEST_PROVIDER_PSEUDONYMIZED_ID,
      });
    });

    it("treats a repeat dismiss as a quiet no-op", async () => {
      const dismiss = () =>
        asProviderA().housingApplication.dismissProviderAlert({
          alertId,
        });

      await dismiss();

      await expect(dismiss()).resolves.toEqual({ dismissed: false });
    });

    it("does not let another organization dismiss it", async () => {
      await expect(
        asProviderB().housingApplication.dismissProviderAlert({
          alertId,
        }),
      ).resolves.toEqual({ dismissed: false });

      await expect(readProviderAlerts()).resolves.toHaveLength(1);
      await expect(readProviderAlerts(asProviderB())).resolves.toEqual([]);
    });
  });

  describe("dismissStaffAlert", () => {
    let alertId: string;

    beforeEach(async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      ({ id: alertId } = await createAlert(testPrismaClient, {
        applicationId,
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      }));
    });

    it("dismisses the staff member's alert", async () => {
      await expect(
        staffCaller().housingApplication.dismissStaffAlert({
          alertId,
        }),
      ).resolves.toEqual({ dismissed: true });

      await expect(readStaffAlerts()).resolves.toEqual([]);
    });

    it("does not let a provider dismiss a staff alert", async () => {
      await expect(
        asProviderA().housingApplication.dismissProviderAlert({
          alertId,
        }),
      ).resolves.toEqual({ dismissed: false });

      await expect(readStaffAlerts()).resolves.toHaveLength(1);
      await expect(readProviderAlerts()).resolves.toEqual([]);
    });
  });

  it("rejects a row with both recipients or neither", async () => {
    await expect(
      createAlert(testPrismaClient, {
        applicationId,
        providerId: providerA.id,
        staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      }),
    ).rejects.toThrow(/Alert_exactly_one_recipient/);

    await expect(
      createAlert(testPrismaClient, { applicationId }),
    ).rejects.toThrow(/Alert_exactly_one_recipient/);
  });

  it("rejects dismiss input with extra keys or a non-UUID id", async () => {
    const withExtraKey = { alertId: crypto.randomUUID(), extra: true };

    await expect(
      staffCaller().housingApplication.dismissStaffAlert(withExtraKey),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(
      staffCaller().housingApplication.dismissStaffAlert({
        alertId: "not-a-uuid",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  describe("NEW_APPLICATION and RELEASE_DATE_CHANGED", () => {
    const INITIAL_RELEASE_DATE = "2099-02-15";

    const readProviderListAlerts = async (caller = asProviderA()) => {
      const { items } = await caller.housingApplication.getProviderApplications(
        {
          pagination: { pageSize: 8 },
        },
      );
      return items.find((item) => item.id === applicationId)?.alerts;
    };

    const makeEligible = async (providerId: string) => {
      const location = await createHousingProviderLocation(testPrismaClient, {
        providerId,
      });
      await createEligibleHousingProvider(testPrismaClient, {
        applicationId,
        providerId,
        providerLocationId: location.id,
      });
    };

    const sendTo = (providerIds: string[]) =>
      staffCaller().housingApplication.sendToProviders({
        applicationId,
        providerIds,
      });

    const changeReleaseDate = (expectedReleaseDate: string | null) =>
      staffCaller().housingApplication.update({
        id: applicationId,
        data: { expectedReleaseDate },
      });

    const setStoredReleaseDate = (date: string | null) =>
      testPrismaClient.housingApplication.update({
        where: { id: applicationId },
        data: { expectedReleaseDate: date ? new Date(date) : null },
      });

    const newApplicationAlert = {
      id: expect.any(String),
      type: AlertType.NEW_APPLICATION,
      metadata: null,
    };

    const releaseDateAlert = (metadata: { deltaDays: number }) => ({
      id: expect.any(String),
      type: AlertType.RELEASE_DATE_CHANGED,
      metadata,
    });

    it("alerts each newly sent organization on its detail and list item", async () => {
      await makeEligible(providerA.id);
      await makeEligible(providerB.id);

      await sendTo([providerA.id, providerB.id]);

      const reads = [asProviderA(), asProviderB()].flatMap((caller) => [
        readProviderAlerts(caller),
        readProviderListAlerts(caller),
      ]);
      await expect(Promise.all(reads)).resolves.toEqual([
        [newApplicationAlert],
        [newApplicationAlert],
        [newApplicationAlert],
        [newApplicationAlert],
      ]);
    });

    it("does not re-alert an organization the case was already sent to", async () => {
      await makeEligible(providerA.id);
      await makeEligible(providerC.id);
      await sendTo([providerA.id]);

      await sendTo([providerA.id, providerC.id]);

      await expect(readProviderAlerts()).resolves.toEqual([
        newApplicationAlert,
      ]);
      await expect(
        testPrismaClient.alert.count({
          where: { providerId: providerC.id, type: AlertType.NEW_APPLICATION },
        }),
      ).resolves.toBe(1);
    });

    it("creates no alert when the send is rejected", async () => {
      await expect(sendTo([providerA.id])).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });

      await expect(testPrismaClient.alert.count()).resolves.toBe(0);
    });

    it("alerts every active organization when the release date changes", async () => {
      await setStoredReleaseDate(INITIAL_RELEASE_DATE);
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      await seedMatch(
        applicationId,
        providerB.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );

      await changeReleaseDate("2099-03-01");

      const expected = [
        releaseDateAlert({
          deltaDays: 14,
        }),
      ];
      await expect(readProviderAlerts()).resolves.toEqual(expected);
      await expect(readProviderAlerts(asProviderB())).resolves.toEqual(
        expected,
      );
      await expect(readProviderListAlerts()).resolves.toEqual(expected);
    });

    it("does not alert an organization the case closed without", async () => {
      await setStoredReleaseDate(INITIAL_RELEASE_DATE);
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.DECLINED,
        ApplicationStage.CLOSED,
      );

      await changeReleaseDate("2099-03-01");

      await expect(testPrismaClient.alert.count()).resolves.toBe(0);
    });

    it("supersedes the previous change, even one the provider dismissed", async () => {
      await setStoredReleaseDate(INITIAL_RELEASE_DATE);
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      await seedMatch(
        applicationId,
        providerB.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      await changeReleaseDate("2099-03-01");
      const [firstForA] = await readProviderAlerts();
      const [firstForB] = await readProviderAlerts(asProviderB());
      await asProviderA().housingApplication.dismissProviderAlert({
        alertId: firstForA.id,
      });

      await changeReleaseDate("2099-02-20");

      const expected = [
        releaseDateAlert({
          deltaDays: -9,
        }),
      ];
      await expect(readProviderAlerts()).resolves.toEqual(expected);
      await expect(readProviderAlerts(asProviderB())).resolves.toEqual(
        expected,
      );
      await expect(
        testPrismaClient.alert.findUniqueOrThrow({
          where: { id: firstForB.id },
        }),
      ).resolves.toMatchObject({
        dismissedAt: expect.any(Date),
        dismissedByPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
      });
    });

    it("creates no alert for a same-day change or a missing date", async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );

      await setStoredReleaseDate(null);
      await changeReleaseDate("2099-03-01");
      await changeReleaseDate("2099-03-01");
      await changeReleaseDate(null);

      await expect(testPrismaClient.alert.count()).resolves.toBe(0);
    });

    it("gives an organization sent the case after a date change NEW_APPLICATION only", async () => {
      await setStoredReleaseDate(INITIAL_RELEASE_DATE);
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      await changeReleaseDate("2099-03-01");
      await makeEligible(providerB.id);

      await sendTo([providerB.id]);

      await expect(readProviderAlerts(asProviderB())).resolves.toEqual([
        newApplicationAlert,
      ]);
    });

    it("hides each type once its visible window has passed", async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      const metadata = {
        deltaDays: 14,
      };
      const seed = (
        type: AlertType,
        days: number,
        alertMetadata?: typeof metadata,
      ) =>
        createAlert(testPrismaClient, {
          applicationId,
          providerId: providerA.id,
          type,
          metadata: alertMetadata,
          createdAt: daysAgo(days),
        });
      await seed(AlertType.NEW_APPLICATION, 3);
      const freshNew = await seed(AlertType.NEW_APPLICATION, 1);
      await seed(AlertType.RELEASE_DATE_CHANGED, 11, metadata);
      const freshRelease = await seed(
        AlertType.RELEASE_DATE_CHANGED,
        9,
        metadata,
      );

      await expect(readProviderAlerts()).resolves.toEqual([
        { id: freshNew.id, type: AlertType.NEW_APPLICATION, metadata: null },
        { id: freshRelease.id, type: AlertType.RELEASE_DATE_CHANGED, metadata },
      ]);
    });

    it("returns no alerts on the detail or list item once closed without the organization", async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.NOT_SELECTED,
        ApplicationStage.CLOSED,
      );
      await createAlert(testPrismaClient, {
        applicationId,
        providerId: providerA.id,
        type: AlertType.NEW_APPLICATION,
      });

      await expect(readProviderAlerts()).resolves.toEqual([]);
      await expect(readProviderListAlerts()).resolves.toEqual([]);
    });

    it("clears a dismissed NEW_APPLICATION from the detail and the list item", async () => {
      await makeEligible(providerA.id);
      await sendTo([providerA.id]);
      const [alert] = await readProviderAlerts();

      await asProviderA().housingApplication.dismissProviderAlert({
        alertId: alert.id,
      });

      await expect(readProviderAlerts()).resolves.toEqual([]);
      await expect(readProviderListAlerts()).resolves.toEqual([]);
    });

    it("rejects metadata that does not match the type's schema, writing nothing", async () => {
      const write = (type: AlertType, metadata: unknown) =>
        createAlerts(testPrismaClient, {
          type,
          applicationId,
          recipients: [{ providerId: providerA.id }],
          metadata,
        });

      await expect(
        write(AlertType.RELEASE_DATE_CHANGED, { deltaDays: 1.5 }),
      ).rejects.toThrow();
      await expect(
        write(AlertType.RELEASE_DATE_CHANGED, {
          deltaDays: 1,
          clientName: "Jane Doe",
        }),
      ).rejects.toThrow();
      await expect(
        write(AlertType.NEW_APPLICATION, { deltaDays: 1 }),
      ).rejects.toThrow();

      await expect(testPrismaClient.alert.count()).resolves.toBe(0);
    });

    it("drops a row whose stored metadata fails to parse and returns the rest", async () => {
      await seedMatch(
        applicationId,
        providerA.id,
        ApplicationSubStage.PROVIDER_REVIEW,
      );
      await createAlert(testPrismaClient, {
        applicationId,
        providerId: providerA.id,
        type: AlertType.RELEASE_DATE_CHANGED,
        metadata: { deltaDays: "fourteen" },
      });
      const valid = await createAlert(testPrismaClient, {
        applicationId,
        providerId: providerA.id,
        type: AlertType.NEW_APPLICATION,
      });

      await expect(readProviderAlerts()).resolves.toEqual([
        { id: valid.id, type: AlertType.NEW_APPLICATION, metadata: null },
      ]);
    });

    it("never gives staff either type", async () => {
      await setStoredReleaseDate(INITIAL_RELEASE_DATE);
      await makeEligible(providerA.id);
      await sendTo([providerA.id]);
      await changeReleaseDate("2099-03-01");

      await expect(readStaffAlerts()).resolves.toEqual([]);
      const { items } = await staffCaller().housingApplication.getByStaff({
        pagination: { pageSize: 8 },
      });
      expect(
        items.find((item) => item.id === applicationId),
      ).not.toHaveProperty("alerts");
    });
  });
});
