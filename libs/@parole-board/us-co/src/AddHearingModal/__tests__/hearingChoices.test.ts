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
  september2026Config,
  september2026MonthDetail,
} from "~@parole-board/common/fixtures";

import { hearingChoices, parseChoice } from "../hearingChoices";

const { entries } = september2026MonthDetail;

describe("hearingChoices", () => {
  test("lists the kinds with no resource, then the resources, by sortOrder", () => {
    const reversed = {
      kinds: [...september2026Config.kinds].reverse(),
      resources: [...september2026Config.resources].reverse(),
    };

    const { boardSessions, facilities } = hearingChoices(reversed, [], null);

    expect(boardSessions.map(({ value, label }) => [value, label])).toEqual([
      ["kind:FULL_BOARD", "Full Board"],
      ["kind:BUSINESS_MEETING", "Business Mtg"],
    ]);
    expect(facilities.map(({ label }) => label)).toEqual(
      september2026Config.resources.map(({ label }) => label),
    );
    expect(facilities[0]).toEqual({
      value: "resource:resource-ACC",
      label: "ACC",
      fullName: "Arrowhead Correctional Center",
      disabled: false,
    });
  });

  test("falls back to the label when a resource has no full name", () => {
    const { facilities } = hearingChoices(
      {
        kinds: september2026Config.kinds,
        resources: [{ ...september2026Config.resources[0], name: null }],
      },
      [],
      null,
    );

    expect(facilities[0].fullName).toBe("ACC");
  });

  test("disables the slots that already have an entry on the date", () => {
    const { boardSessions, facilities } = hearingChoices(
      september2026Config,
      entries,
      "2026-09-14",
    );

    expect(boardSessions.every(({ disabled }) => !disabled)).toBe(true);
    expect(
      facilities.filter(({ disabled }) => disabled).map(({ label }) => label),
    ).toEqual(["DENCOM WTM BDY", "FCF"]);
  });

  test("counts a cancelled entry as taking its slot", () => {
    const cancelled = entries.map((entry) =>
      entry.date === "2026-09-25" ? { ...entry, cancelled: true } : entry,
    );

    const { boardSessions } = hearingChoices(
      september2026Config,
      cancelled,
      "2026-09-25",
    );

    expect(boardSessions.map(({ disabled }) => disabled)).toEqual([true, true]);
  });

  test("disables nothing with no date", () => {
    const { boardSessions, facilities } = hearingChoices(
      september2026Config,
      entries,
      null,
    );

    expect(
      [...boardSessions, ...facilities].some(({ disabled }) => disabled),
    ).toBe(false);
  });

  test("offers no facilities when no kind takes a resource", () => {
    const { facilities } = hearingChoices(
      {
        ...september2026Config,
        kinds: september2026Config.kinds.filter((k) => !k.requiresResource),
      },
      [],
      null,
    );

    expect(facilities).toEqual([]);
  });
});

describe("parseChoice", () => {
  test("reads board sessions and facilities, and nothing else", () => {
    expect(parseChoice("kind:FULL_BOARD")).toEqual({
      type: "boardSession",
      kindCode: "FULL_BOARD",
    });
    expect(parseChoice("resource:resource-FCF")).toEqual({
      type: "facility",
      resourceId: "resource-FCF",
    });
    expect(parseChoice("FCF")).toBeNull();
  });
});
