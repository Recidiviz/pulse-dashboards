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
import { describe, expect, it } from "vitest";

import { HOUSING_APPLICATION_NOT_FOUND } from "~@idaho-th/trpc/routes/housing-common/housingApplication.errors";

import {
  requireProviderApplicationDetail,
  requireStaffApplicationDetail,
} from "../applicationDetail.helpers";
import {
  buildProviderApplicationDetailRow,
  buildStaffApplicationDetailRow,
  staffPseudonymizedId,
} from "./applicationDetail.testFixtures";

describe("requireStaffApplicationDetail", () => {
  it("returns context when staff owns the application", () => {
    const context = buildStaffApplicationDetailRow();

    expect(
      requireStaffApplicationDetail(context as never, staffPseudonymizedId),
    ).toBe(context);
  });

  it("throws NOT_FOUND when the application does not exist for this staff member", () => {
    expect(() =>
      requireStaffApplicationDetail(null, staffPseudonymizedId),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });

  it("throws NOT_FOUND when staff does not own the application", () => {
    const context = buildStaffApplicationDetailRow({
      staffPseudonymizedId: "other-staff",
    });

    expect(() =>
      requireStaffApplicationDetail(context as never, staffPseudonymizedId),
    ).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message: HOUSING_APPLICATION_NOT_FOUND.STAFF_APPLICATION,
      } satisfies Partial<TRPCError>),
    );
  });
});

describe("requireProviderApplicationDetail", () => {
  it("returns context when the provider owns the application", () => {
    const context = buildProviderApplicationDetailRow();

    expect(requireProviderApplicationDetail(context)).toBe(context);
  });

  it("throws NOT_FOUND when the application does not exist for this provider", () => {
    expect(() => requireProviderApplicationDetail(null)).toThrow(
      expect.objectContaining({
        code: "NOT_FOUND",
        message:
          HOUSING_APPLICATION_NOT_FOUND.PROVIDER_APPLICATION_FOR_PROVIDER,
      } satisfies Partial<TRPCError>),
    );
  });
});
