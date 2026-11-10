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
  ApplicationStage,
  ApplicationSubStage,
} from "~@idaho-th/prisma/client";
import {
  findStaffAdvanceStageApplication,
  requireStaffAdvanceStageApplication,
  updateHousingApplicationAdvanceStage,
} from "~@idaho-th/trpc/routes/staffApplication/advanceStage.helpers";
import {
  TEST_DATES,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/factories";
import {
  readHousingApplication,
  readStaffApplication,
} from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

import { seedStaffApplication } from "./staffApplication.fixtures";

describe("findStaffAdvanceStageApplication", () => {
  test("loads the application scoped to the authenticated staff member", async () => {
    const { application, providerApplications, homePlan } =
      await seedStaffApplication(testPrismaClient, {
        stage: ApplicationStage.APPROVALS,
        providerApplicationStages: [ApplicationStage.APPROVALS],
        homePlan: "provider",
      });

    const context = await findStaffAdvanceStageApplication(
      testPrismaClient,
      application.id,
      TEST_STAFF_PSEUDONYMIZED_ID,
    );

    expect(context).toEqual({
      id: application.id,
      formData: application.formData,
      staffApplication: {
        stage: ApplicationStage.APPROVALS,
        paroleCommissionDecision: null,
      },
      homePlan: {
        selectedProviderId: homePlan?.selectedProviderId,
        releaseDecision: null,
        homePlanInvestigation: null,
      },
      providerApplications: [
        {
          id: providerApplications[0].id,
          providerId: providerApplications[0].providerId,
          stage: ApplicationStage.APPROVALS,
          subStage: ApplicationSubStage.PROVIDER_REVIEW,
        },
      ],
    });
  });

  test("returns null for another staff member's application", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    await expect(
      findStaffAdvanceStageApplication(
        testPrismaClient,
        application.id,
        "some-other-staff",
      ),
    ).resolves.toBeNull();
  });
});

describe("requireStaffAdvanceStageApplication", () => {
  test("throws when the row or its staff application is missing", () => {
    expect(() => requireStaffAdvanceStageApplication(null)).toThrow(TRPCError);
    expect(() =>
      requireStaffAdvanceStageApplication({
        id: "app-1",
        staffApplication: null,
      } as never),
    ).toThrow(TRPCError);
  });

  test("accepts a staff-owned row", () => {
    const row = { id: "app-1", staffApplication: { stage: "APPLICATION" } };
    expect(() =>
      requireStaffAdvanceStageApplication(row as never),
    ).not.toThrow();
  });
});

describe("updateHousingApplicationAdvanceStage", () => {
  test("bumps lastActivityAt so Last Updated stays fresh", async () => {
    const { application } = await seedStaffApplication(testPrismaClient);

    const result = await updateHousingApplicationAdvanceStage(
      testPrismaClient,
      application.id,
      {
        staffApplication: { update: { stage: ApplicationStage.APPROVALS } },
      },
    );

    expect(result.staffApplication).toMatchObject({
      stage: ApplicationStage.APPROVALS,
    });

    const updated = await readHousingApplication(
      testPrismaClient,
      application.id,
    );
    expect(updated.lastActivityAt.getTime()).toBeGreaterThan(
      TEST_DATES.LAST_ACTIVITY.getTime(),
    );

    const staffApplication = await readStaffApplication(
      testPrismaClient,
      application.id,
    );
    expect(staffApplication.stage).toBe(ApplicationStage.APPROVALS);
  });
});
