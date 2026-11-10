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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApplicationStage } from "~@idaho-th/prisma/client";
import {
  RELEASE_DATE_IN_PAST_ERROR,
  RELEASE_DATE_INVALID_ERROR,
} from "~@idaho-th/shared";

import {
  assertReleaseDateNotInPast,
  assertStaffCaseApplicationStage,
  assertStaffCaseModifiable,
  assertStaffCaseNotClosed,
  assertStaffCaseNotDraft,
  STAFF_CASE_CLOSED_MESSAGE,
  STAFF_CASE_DRAFT_MESSAGE,
  STAFF_CASE_NOT_APPLICATION_MESSAGE,
} from "../housingApplication.errors";

describe("assertStaffCaseNotClosed", () => {
  it("allows open stages", () => {
    expect(() =>
      assertStaffCaseNotClosed(ApplicationStage.APPLICATION),
    ).not.toThrow();
  });

  it("rejects a closed case", () => {
    expect(() => assertStaffCaseNotClosed(ApplicationStage.CLOSED)).toThrow(
      STAFF_CASE_CLOSED_MESSAGE,
    );
  });
});

describe("assertStaffCaseNotDraft", () => {
  it("allows non-draft stages", () => {
    expect(() =>
      assertStaffCaseNotDraft(ApplicationStage.APPLICATION),
    ).not.toThrow();
  });

  it("rejects a draft case", () => {
    expect(() => assertStaffCaseNotDraft(ApplicationStage.DRAFT)).toThrow(
      STAFF_CASE_DRAFT_MESSAGE,
    );
  });
});

describe("assertStaffCaseApplicationStage", () => {
  it("allows the Application stage", () => {
    expect(() =>
      assertStaffCaseApplicationStage(ApplicationStage.APPLICATION),
    ).not.toThrow();
  });

  it.each([
    ApplicationStage.DRAFT,
    ApplicationStage.APPROVALS,
    ApplicationStage.RELEASE,
    ApplicationStage.CLOSED,
  ] as const)("rejects the %s stage", (stage) => {
    expect(() => assertStaffCaseApplicationStage(stage)).toThrow(
      STAFF_CASE_NOT_APPLICATION_MESSAGE,
    );
  });
});

describe("assertStaffCaseModifiable", () => {
  it("allows Application Approvals and Release stages", () => {
    expect(() =>
      assertStaffCaseModifiable(ApplicationStage.APPLICATION),
    ).not.toThrow();
    expect(() =>
      assertStaffCaseModifiable(ApplicationStage.APPROVALS),
    ).not.toThrow();
    expect(() =>
      assertStaffCaseModifiable(ApplicationStage.RELEASE),
    ).not.toThrow();
  });

  it("rejects closed cases", () => {
    expect(() => assertStaffCaseModifiable(ApplicationStage.CLOSED)).toThrow(
      STAFF_CASE_CLOSED_MESSAGE,
    );
  });

  it("rejects draft cases", () => {
    expect(() => assertStaffCaseModifiable(ApplicationStage.DRAFT)).toThrow(
      STAFF_CASE_DRAFT_MESSAGE,
    );
  });
});

describe("assertReleaseDateNotInPast", () => {
  // Fixed so the grace-period boundary does not move with the clock.
  const NOW = new Date("2026-10-21T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const check = (next: string | null, previous: string | null = null) =>
    assertReleaseDateNotInPast(
      { formData: { tpdHousingNeededDate: next } },
      { tpdHousingNeededDate: previous },
    );

  describe("dates it can read", () => {
    it("allows a future date", () => {
      expect(() => check("12/01/2026")).not.toThrow();
    });

    it("allows a date inside the grace period", () => {
      expect(() => check("2026-10-15")).not.toThrow();
    });

    it("rejects a date beyond the grace period", () => {
      expect(() => check("2026-10-01")).toThrow(RELEASE_DATE_IN_PAST_ERROR);
    });

    it("rejects a date years in the past", () => {
      expect(() => check("1/5/2020")).toThrow(RELEASE_DATE_IN_PAST_ERROR);
    });
  });

  describe("dates it cannot read are rejected, not skipped", () => {
    it.each([
      ["a two-digit year", "1/5/20"],
      ["US order with dashes", "5-1-2020"],
      ["a month name", "Jan 5 2020"],
      ["free text", "not a date at all"],
      ["an empty-ish string", "   -   "],
    ])("rejects %s", (_label, value) => {
      expect(() => check(value)).toThrow(RELEASE_DATE_INVALID_ERROR);
    });

    it.each([
      ["a month that does not exist", "2026-13-45"],
      ["a day that does not exist", "2026-02-30"],
      ["an out-of-range US date", "13/45/2026"],
    ])("rejects %s", (_label, value) => {
      expect(() => check(value)).toThrow(RELEASE_DATE_INVALID_ERROR);
    });
  });

  describe("shapes the parser accepts on purpose", () => {
    it("accepts an ISO timestamp, which is how a stored column arrives", () => {
      expect(() => check("2026-12-01T00:00:00.000Z")).not.toThrow();
    });

    it("reads the day from an ISO value with trailing text", () => {
      expect(() => check("2026-12-01Tanything")).not.toThrow();
      expect(() => check("2020-01-05Tanything")).toThrow(
        RELEASE_DATE_IN_PAST_ERROR,
      );
    });

    it("treats a whitespace-only value as clearing the date", () => {
      expect(() => check("   ")).not.toThrow();
      expect(() => check("\t")).not.toThrow();
    });
  });

  describe("values that are not a move", () => {
    it("allows clearing the date", () => {
      expect(() => check(null)).not.toThrow();
      expect(() => check("")).not.toThrow();
    });

    it("allows resubmitting a stored date that has fallen behind", () => {
      expect(() => check("2020-01-05", "2020-01-05")).not.toThrow();
    });

    it("allows resubmitting a stored date in another format", () => {
      expect(() => check("1/5/2020", "2020-01-05")).not.toThrow();
    });

    it("allows resubmitting a stored value it cannot read", () => {
      expect(() => check("1/5/20", "1/5/20")).not.toThrow();
    });

    it("allows it back even though the client trimmed it on the way out", () => {
      // Vertex can store a value with surrounding whitespace; the form trims
      // before sending, so a raw comparison would reject the whole record.
      expect(() => check("1/5/20", " 1/5/20 ")).not.toThrow();
      expect(() => check(" 1/5/20 ", "1/5/20")).not.toThrow();
    });

    it("rejects editing one unreadable value into another", () => {
      expect(() => check("2/6/21", "1/5/20")).toThrow(
        RELEASE_DATE_INVALID_ERROR,
      );
    });
  });

  describe("expectedReleaseDate is checked on the same terms", () => {
    it("rejects a column value beyond the grace period", () => {
      expect(() =>
        assertReleaseDateNotInPast(
          { expectedReleaseDate: "2026-10-01" },
          { expectedReleaseDate: null },
        ),
      ).toThrow(RELEASE_DATE_IN_PAST_ERROR);
    });

    it("allows the stored column resubmitted as MM/dd/yyyy", () => {
      // previous arrives as a full ISO timestamp and next as what the picker
      // emits, so only the day-level comparison can match them.
      expect(() =>
        assertReleaseDateNotInPast(
          { expectedReleaseDate: "01/05/2020" },
          { expectedReleaseDate: new Date("2020-01-05T00:00:00.000Z") },
        ),
      ).not.toThrow();
    });

    it("rejects a column value it cannot read", () => {
      expect(() =>
        assertReleaseDateNotInPast(
          { expectedReleaseDate: "1/5/20" },
          { expectedReleaseDate: null },
        ),
      ).toThrow(RELEASE_DATE_INVALID_ERROR);
    });
  });
});
