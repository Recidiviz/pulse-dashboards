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
  ApplicationIntakeStatus,
  ApplicationStage,
  ApplicationStatus,
  ApplicationSubStage,
  type Prisma,
} from "~@idaho-th/prisma/client";
import { DEFAULT_HOUSING_APPLICATION_FORM_VALUES } from "~@idaho-th/shared/fixtures/housingApplication";
import {
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";
import {
  createHousingApplication,
  createStaffHousingApplication,
} from "~@idaho-th/trpc/test/factories";
import { readStaffApplication } from "~@idaho-th/trpc/test/reads";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";

const SUBMITTED_FORM_DATA = {
  ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
  clientFullName: "Jane Doe",
};

/** A staff-owned DRAFT intake awaiting submission. */
async function seedDraftIntakeApplication(
  overrides: Partial<Prisma.HousingApplicationUncheckedCreateInput> = {},
  staffPseudonymizedId = TEST_STAFF_PSEUDONYMIZED_ID,
) {
  const application = await createHousingApplication(testPrismaClient, {
    clientName: "",
    formData: {},
    sentToProvidersAt: null,
    ...overrides,
  });

  await createStaffHousingApplication(testPrismaClient, {
    applicationId: application.id,
    staffPseudonymizedId,
    intakeStatus: ApplicationIntakeStatus.DRAFT,
    stage: ApplicationStage.DRAFT,
    subStage: null,
    status: ApplicationStatus.ACTION_NEEDED,
  });

  return application;
}

describe("draftIntakeRouter", () => {
  describe("submitDraft", () => {
    it("persists the submission for the owning staff member", async () => {
      const application = await seedDraftIntakeApplication();

      const result = await staffCaller().housingApplication.submitDraft({
        id: application.id,
        formData: SUBMITTED_FORM_DATA,
      });

      expect(result.staffApplication).toMatchObject({
        intakeStatus: ApplicationIntakeStatus.SUBMITTED,
        stage: ApplicationStage.APPLICATION,
        subStage: ApplicationSubStage.PROVIDER_REVIEW,
      });

      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({
        intakeStatus: ApplicationIntakeStatus.SUBMITTED,
        stage: ApplicationStage.APPLICATION,
      });
    });

    it("rejects submitting a draft owned by another staff member", async () => {
      const application = await seedDraftIntakeApplication({}, "other-staff");

      await expect(
        staffCaller().housingApplication.submitDraft({
          id: application.id,
          formData: SUBMITTED_FORM_DATA,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });

      await expect(
        readStaffApplication(testPrismaClient, application.id),
      ).resolves.toMatchObject({ intakeStatus: ApplicationIntakeStatus.DRAFT });
    });
  });
});
