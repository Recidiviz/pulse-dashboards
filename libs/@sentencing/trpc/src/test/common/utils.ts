// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { inferRouterOutputs } from "@trpc/server";
import _ from "lodash";
import { expect, vi } from "vitest";

import type { AppRouter } from "~@sentencing/trpc";
import { testkit } from "~@sentencing/trpc/test/setup";
import {
  fakeCase,
  fakeClient,
  fakeStaff,
} from "~@sentencing/trpc/test/setup/seed";

export type staffRouterOutput =
  inferRouterOutputs<AppRouter>["staff"]["getStaff"];

export async function testAndGetSentryReports(expectedLength = 1) {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(expectedLength);

    return reports;
  });

  return sentryReports;
}

export async function testGetStaff(returnedStaff: staffRouterOutput) {
  expect(returnedStaff).toEqual(
    expect.objectContaining({
      ..._.omit(fakeStaff, ["externalId", "dueDate"]),
      officeAddress: null,
      officePhoneNumber: null,
      cases: expect.any(Array),
    }),
  );

  expect(returnedStaff.cases).toHaveLength(1);

  const [staffCase] = returnedStaff.cases;

  expect(staffCase).toEqual(
    expect.objectContaining({
      id: fakeCase.id,
      externalId: fakeCase.externalId,
      reportType: fakeCase.reportType,
      status: fakeCase.status,
      offense: fakeCase.offense,
      isCancelled: fakeCase.isCancelled,
      assignedTo: "You", // Regular staff viewing their own case
      client: expect.objectContaining(
        _.pick(fakeClient, ["fullName", "externalId"]),
      ),
    }),
  );

  // dueDate/customDueDate semantics:
  // When customDueDate is set, the API should return it as the effective dueDate
  expect(staffCase.dueDate).toBe(staffCase.customDueDate);
}
