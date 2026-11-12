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

import type { EntryDto, EntryKindCode } from "~@parole-board/common";
import { september2026MonthDetail } from "~@parole-board/common/fixtures";

import { canDeleteEntry } from "../canDeleteEntry";

const entryOfKind = (code: string): EntryDto => {
  const entry = september2026MonthDetail.entries.find(
    (e) => e.kind.code === code,
  );
  if (!entry) throw new Error(`No fixture entry of kind ${code}`);
  return entry;
};

describe("canDeleteEntry", () => {
  test.each(["HEARING", "FULL_BOARD"])("is true for %s", (code) => {
    expect(canDeleteEntry(entryOfKind(code))).toBe(true);
  });

  test("is false for a Business Meeting", () => {
    expect(canDeleteEntry(entryOfKind("BUSINESS_MEETING"))).toBe(false);
  });

  test.each([true, false])(
    "returns the kind's deletable flag (%s) for a kind code it has never seen",
    (deletable) => {
      const hearing = entryOfKind("HEARING");
      // The API's kind codes are a fixed list, so the cast stands in for a
      // kind added later.
      const entry = {
        ...hearing,
        kind: {
          ...hearing.kind,
          code: "MADE_UP_KIND" as EntryKindCode,
          deletable,
        },
      };

      expect(canDeleteEntry(entry)).toBe(deletable);
    },
  );
});
