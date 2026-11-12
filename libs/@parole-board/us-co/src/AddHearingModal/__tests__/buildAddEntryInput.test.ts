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

import type { KindDto } from "~@parole-board/common";
import { september2026Config } from "~@parole-board/common/fixtures";

import { monthDays } from "../../model/month";
import { buildAddEntryInput } from "../buildAddEntryInput";

const { kinds } = september2026Config;
const MONTH_ID = "month-2026-9";

describe("buildAddEntryInput", () => {
  test("adds a facility with the kind that requires a resource", () => {
    expect(
      buildAddEntryInput({
        monthId: MONTH_ID,
        date: "2026-09-16",
        choice: "resource:resource-FCF",
        kinds,
      }),
    ).toEqual({
      monthId: MONTH_ID,
      date: "2026-09-16",
      kindCode: "HEARING",
      resourceId: "resource-FCF",
    });
  });

  test.each(["FULL_BOARD", "BUSINESS_MEETING"])(
    "adds a %s with no resource",
    (kindCode) => {
      expect(
        buildAddEntryInput({
          monthId: MONTH_ID,
          date: "2026-09-18",
          choice: `kind:${kindCode}`,
          kinds,
        }),
      ).toEqual({
        monthId: MONTH_ID,
        date: "2026-09-18",
        kindCode,
        resourceId: null,
      });
    },
  );

  test("sends the day picker's zero-padded date as it is", () => {
    const fourth = monthDays({ year: 2026, month: 9 })[3];

    expect(
      buildAddEntryInput({
        monthId: MONTH_ID,
        date: fourth,
        choice: "kind:FULL_BOARD",
        kinds,
      })?.date,
    ).toBe("2026-09-04");
  });

  test("takes the facility's kind from the config, not a constant", () => {
    // HEARING is the only kind that requires a resource in Colorado's
    // config, so a config whose resource kind has another code proves the
    // code isn't hard-coded.
    const renamed = kinds.map((kind) =>
      kind.requiresResource ? { ...kind, code: "INTERVIEW" } : kind,
    ) as unknown as KindDto[];

    expect(
      buildAddEntryInput({
        monthId: MONTH_ID,
        date: "2026-09-16",
        choice: "resource:resource-FCF",
        kinds: renamed,
      })?.kindCode,
    ).toBe("INTERVIEW");
  });

  test.each([
    ["an unknown value", "slot:FCF"],
    ["a kind the config doesn't have", "kind:RETREAT"],
    ["a board session that requires a resource", "kind:HEARING"],
  ])("returns null for %s", (_, choice) => {
    expect(
      buildAddEntryInput({
        monthId: MONTH_ID,
        date: "2026-09-16",
        choice,
        kinds,
      }),
    ).toBeNull();
  });

  test("returns null for a facility when no kind takes a resource", () => {
    expect(
      buildAddEntryInput({
        monthId: MONTH_ID,
        date: "2026-09-16",
        choice: "resource:resource-FCF",
        kinds: kinds.filter((kind) => !kind.requiresResource),
      }),
    ).toBeNull();
  });
});
