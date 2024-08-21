// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import _ from "lodash";
import { describe, expect, test } from "vitest";

import { prismaClient } from "~sentencing-server/prisma";
import { testTRPCClient } from "~sentencing-server/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeStaff,
} from "~sentencing-server/test/setup/seed";

describe("staff router", () => {
  describe("getStaff", () => {
    test("should return staff if staff exists", async () => {
      const returnedStaff = await testTRPCClient.staff.getStaff.query({
        pseudonymizedId: fakeStaff.pseudonymizedId,
      });

      expect(returnedStaff).toEqual({
        ..._.omit(fakeStaff, "externalId"),
        Cases: [
          {
            ..._.pick(fakeCase, [
              "id",
              "externalId",
              "dueDate",
              "reportType",
              "status",
              "offense",
            ]),
            Client: _.pick(fakeClient, ["fullName"]),
          },
        ],
      });
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.staff.getStaff.query({
          pseudonymizedId: "not-a-staff-id",
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });
  });

  describe("updateStaff", () => {
    test("should update isFirstLogin", async () => {
      await testTRPCClient.staff.updateStaff.mutate({
        pseudonymizedId: fakeStaff.pseudonymizedId,
        hasLoggedIn: true,
      });

      const dbStaff = await prismaClient.staff.findUnique({
        where: { pseudonymizedId: fakeStaff.pseudonymizedId },
      });

      expect(dbStaff?.hasLoggedIn).toBeTruthy();
    });

    test("should throw error if staff does not exist", async () => {
      await expect(() =>
        testTRPCClient.staff.updateStaff.mutate({
          pseudonymizedId: "not-a-staff-id",
          hasLoggedIn: true,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Staff with that id was not found",
        }),
      );
    });
  });
});
