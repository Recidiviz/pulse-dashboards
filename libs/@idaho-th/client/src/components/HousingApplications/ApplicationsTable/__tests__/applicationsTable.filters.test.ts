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

import { USER_ROLE, type UserRole } from "~@idaho-th/shared";

import {
  buildApplicationFilters,
  EMPTY_APPLICATIONS_TABLE_FILTERS,
  hasActiveFilters,
  LAST_UPDATED_FILTER_OPTIONS,
  PROVIDER_STATUS_FILTER_OPTIONS,
  RELEASE_DATE_FILTER_OPTIONS,
  STAFF_STATUS_FILTER_OPTIONS,
  STAGE_FILTER_OPTIONS,
  STAGE_FILTER_TO_VALUE,
  type StatusFilterOption,
} from "../applicationsTable.filters";

describe("hasActiveFilters", () => {
  it("returns false when all arrays are empty", () => {
    expect(hasActiveFilters(EMPTY_APPLICATIONS_TABLE_FILTERS)).toBe(false);
  });

  it("returns true when any filter array is non-empty", () => {
    const filters = {
      ...EMPTY_APPLICATIONS_TABLE_FILTERS,
      stage: [STAGE_FILTER_OPTIONS[0]],
    };
    expect(hasActiveFilters(filters)).toBe(true);
  });

  it("returns true when the homePlan boolean filter is on", () => {
    const filters = {
      ...EMPTY_APPLICATIONS_TABLE_FILTERS,
      homePlan: true,
    };
    expect(hasActiveFilters(filters)).toBe(true);
  });
});

describe("dashboard filter option labels", () => {
  it("maps every stage option to a filter value", () => {
    STAGE_FILTER_OPTIONS.forEach((option) => {
      expect(STAGE_FILTER_TO_VALUE[option]).toBeDefined();
    });
  });

  it("maps every status option offered to each role to filter values", () => {
    [
      { role: USER_ROLE.STAFF, options: STAFF_STATUS_FILTER_OPTIONS },
      { role: USER_ROLE.PROVIDER, options: PROVIDER_STATUS_FILTER_OPTIONS },
    ].forEach(({ role, options }) => {
      options.forEach((option) => {
        const result = buildApplicationFilters(
          { ...EMPTY_APPLICATIONS_TABLE_FILTERS, status: [option] },
          role,
        );
        expect(result.status?.length).toBeGreaterThan(0);
      });
    });
  });
});

describe("status filter values by role", () => {
  const statusFor = (option: StatusFilterOption, role: UserRole) =>
    buildApplicationFilters(
      { ...EMPTY_APPLICATIONS_TABLE_FILTERS, status: [option] },
      role,
    ).status;

  it("staff Waiting On covers only waiting", () => {
    expect(statusFor("Waiting On", USER_ROLE.STAFF)).toEqual(["WAITING"]);
  });

  it("staff parole board, P&P, and awaiting release are separate options", () => {
    expect(statusFor("Waiting on Parole Board", USER_ROLE.STAFF)).toEqual([
      "WAITING_ON_PAROLE_BOARD",
    ]);
    expect(statusFor("Waiting on P&P", USER_ROLE.STAFF)).toEqual([
      "WAITING_ON_PP",
    ]);
    expect(statusFor("Awaiting Release", USER_ROLE.STAFF)).toEqual([
      "AWAITING_RELEASE",
    ]);
  });

  it("staff Ready covers only done", () => {
    expect(statusFor("Ready", USER_ROLE.STAFF)).toEqual(["DONE"]);
  });

  it("provider Waiting On covers only waiting", () => {
    expect(statusFor("Waiting On", USER_ROLE.PROVIDER)).toEqual(["WAITING"]);
  });

  it("provider Awaiting Release covers only awaiting release", () => {
    expect(statusFor("Awaiting Release", USER_ROLE.PROVIDER)).toEqual([
      "AWAITING_RELEASE",
    ]);
  });
});

describe("buildApplicationFilters", () => {
  it("includes only the non-empty filter categories", () => {
    const filters = {
      releaseDate: [RELEASE_DATE_FILTER_OPTIONS[0]],
      stage: [STAGE_FILTER_OPTIONS[0]],
      status: [STAFF_STATUS_FILTER_OPTIONS[0]],
      lastUpdated: [LAST_UPDATED_FILTER_OPTIONS[0]],
      homePlan: false,
    };

    const result = buildApplicationFilters(filters, USER_ROLE.STAFF);

    expect(result.stage).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.releaseDate).toBeDefined();
    expect(result.lastUpdated).toBeDefined();
    expect(Object.keys(result)).toHaveLength(4);
  });

  it("returns an empty object when Clear has reset every filter", () => {
    expect(
      buildApplicationFilters(
        EMPTY_APPLICATIONS_TABLE_FILTERS,
        USER_ROLE.STAFF,
      ),
    ).toEqual({});
  });
});

describe("Home Plan filter", () => {
  it("is included for provider role when set", () => {
    const result = buildApplicationFilters(
      { ...EMPTY_APPLICATIONS_TABLE_FILTERS, homePlan: true },
      USER_ROLE.PROVIDER,
    );
    expect(result.homePlan).toBe(true);
  });

  it("is omitted for provider role when unset", () => {
    const result = buildApplicationFilters(
      EMPTY_APPLICATIONS_TABLE_FILTERS,
      USER_ROLE.PROVIDER,
    );
    expect(result.homePlan).toBeUndefined();
  });

  it("is ignored for staff role even when set", () => {
    const result = buildApplicationFilters(
      { ...EMPTY_APPLICATIONS_TABLE_FILTERS, homePlan: true },
      USER_ROLE.STAFF,
    );
    expect(result.homePlan).toBeUndefined();
  });
});
