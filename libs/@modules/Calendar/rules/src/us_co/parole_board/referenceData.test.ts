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

import type { CalendarEntryType } from "../../calendarRules";
import { describePatternRules } from "../../describePattern";
import { parseCalendarConfig } from "../../storage/calendarConfig";
import { assertEntryShape, entrySlotKey } from "../../storage/entries";
import { parsePatternRules } from "../../storage/patternRules";
import { US_CO_PAROLE_BOARD_SETTINGS } from "./calendar";
import { US_CO_PAROLE_BOARD_ENTRY_TYPES } from "./entryTypes";
import { US_CO_REFERENCE_DATA } from "./referenceData";

const { calendar, resourceTypes, resources, kinds, patterns } =
  US_CO_REFERENCE_DATA;

const hearingPatterns = patterns.filter(
  ({ kindCode }) => kindCode === "HEARING",
);

// The facility patterns sheet: code, typeCode, Pattern text and startTime, in
// sheet order.
const SHEET: [string, string, string, string][] = [
  ["FCF", "FACILITY", "1st and 2nd Monday", "08:00"],
  ["CTCF", "FACILITY", "1st Monday", "08:00"],
  ["SCCF", "FACILITY", "1st Thursday", "08:00"],
  ["ACC", "FACILITY", "1st Tuesday", "08:00"],
  ["CSP", "FACILITY", "1st Wednesday", "08:00"],
  ["FMCC", "FACILITY", "1st Wednesday", "08:00"],
  ["AVCF", "FACILITY", "2nd Thursday", "08:00"],
  ["LVCF", "FACILITY", "2nd Thursday", "08:00"],
  ["CCF", "FACILITY", "2nd Tuesday and Wednesday", "08:00"],
  ["SCF", "FACILITY", "2nd Tuesday and Wednesday", "08:00"],
  ["ICC/FED", "FACILITY", "3rd Thursday", "10:00"],
  ["YOS", "FACILITY", "3rd Thursday", "08:00"],
  ["BVCF", "FACILITY", "3rd Tuesday", "08:00"],
  ["BVMC", "FACILITY", "3rd Tuesday", "08:00"],
  ["CCCF", "FACILITY", "3rd Wednesday and Thursday", "08:00"],
  ["BCCF", "FACILITY", "4th Monday and Tuesday", "08:00"],
  ["LCF", "FACILITY", "4th Monday", "08:00"],
  ["DCC", "FACILITY", "4th Thursday", "08:00"],
  ["DRDC", "FACILITY", "4th Thursday", "08:00"],
  ["SCC", "FACILITY", "4th Thursday", "08:00"],
  ["RCC", "FACILITY", "4th Tuesday and Wednesday", "08:00"],
  ["TCF", "FACILITY", "4th Tuesday", "08:00"],
  ["DWCF", "FACILITY", "4th Wednesday", "08:00"],
  ["DENCOM WTM BDY", "COMMUNITY", "2nd Monday", "08:00"],
  ["BOULDER", "COMMUNITY", "3rd Thursday", "08:00"],
  ["HILLTOP", "COMMUNITY", "3rd Thursday", "08:00"],
  ["ISP FREMONT", "COMMUNITY", "3rd Thursday", "09:00"],
  ["ISP/MONTROSE", "COMMUNITY", "3rd Thursday", "08:00"],
  ["ISPGRFLD/MESA", "COMMUNITY", "3rd Thursday", "08:00"],
  ["LAMAR", "COMMUNITY", "3rd Thursday", "11:00"],
  ["SLV", "COMMUNITY", "3rd Thursday", "10:00"],
  ["STERCOM", "COMMUNITY", "3rd Thursday", "13:00"],
  ["ISP/DEN ENG", "COMMUNITY", "3rd Wednesday", "08:00"],
  ["COSCOM", "COMMUNITY", "1st Thursday", "08:00"],
  ["FT. COLLINS", "COMMUNITY", "1st Thursday", "10:00"],
  ["GREELEY", "COMMUNITY", "1st Tuesday", "10:00"],
  ["ICCS/PUEBLO", "COMMUNITY", "4th Thursday", "08:00"],
];

function hearingPatternFor(code: string) {
  const pattern = hearingPatterns.find(
    ({ resourceCode }) => resourceCode === code,
  );
  if (!pattern) throw new Error(`No HEARING pattern for ${code}`);
  return pattern;
}

// These check the fixture against the facility patterns sheet and Spec D. They
// say nothing about the database, whose data the seed SQL owns.
describe("US_CO_REFERENCE_DATA", () => {
  it("parses with parseCalendarConfig unchanged", () => {
    expect(parseCalendarConfig(US_CO_REFERENCE_DATA)).toEqual(
      US_CO_REFERENCE_DATA,
    );
  });

  it("is the US_CO Parole Board calendar, with only its identity stored", () => {
    expect(calendar).toEqual({
      code: "PAROLE_BOARD_PUBLIC",
      name: "Colorado Parole Board hearing calendar",
    });
  });

  it("puts every pattern rule on a weekday the Board works", () => {
    const allowed: readonly string[] =
      US_CO_PAROLE_BOARD_SETTINGS.allowedWeekdays;
    const ruleWeekdays = new Set(
      patterns.flatMap(({ rules }) => rules.map(({ weekday }) => weekday)),
    );
    expect(
      [...ruleWeekdays].filter((weekday) => !allowed.includes(weekday)),
    ).toEqual([]);
  });

  it("has 2 resource types, 3 kinds, 37 resources, 39 patterns and 45 rules", () => {
    expect(resourceTypes).toHaveLength(2);
    expect(kinds).toHaveLength(3);
    expect(resources).toHaveLength(37);
    expect(
      resources.filter(({ typeCode }) => typeCode === "FACILITY"),
    ).toHaveLength(23);
    expect(
      resources.filter(({ typeCode }) => typeCode === "COMMUNITY"),
    ).toHaveLength(14);
    expect(patterns).toHaveLength(39);
    expect(patterns.flatMap(({ rules }) => rules)).toHaveLength(45);
  });

  it("has the sheet's resources in sheet order, active, with sortOrder in steps of 10", () => {
    expect(
      resources.map(({ code, typeCode, sortOrder, isActive }) => [
        code,
        typeCode,
        sortOrder,
        isActive,
      ]),
    ).toEqual(
      SHEET.map(([code, typeCode], i) => [code, typeCode, (i + 1) * 10, true]),
    );
  });

  it("has unique resource codes, kind codes and resource sortOrders", () => {
    const unique = (values: unknown[]) => new Set(values).size;
    expect(unique(resources.map(({ code }) => code))).toBe(resources.length);
    expect(unique(kinds.map(({ code }) => code))).toBe(kinds.length);
    expect(unique(resources.map(({ sortOrder }) => sortOrder))).toBe(
      resources.length,
    );
  });

  it("uses the design's labels, CDOC's prison names and the Calendar Unit's community names", () => {
    const byCode = new Map(resources.map((r) => [r.code, r]));
    expect(byCode.get("ISPGRFLD/MESA")).toMatchObject({
      label: "ISP Grfld/Mesa",
      name: "Garfield/Mesa",
    });
    expect(byCode.get("ICCS/PUEBLO")).toMatchObject({
      label: "ICCS/Pueblo",
      name: "Pueblo",
    });
    expect(byCode.get("CTCF")?.name).toBe(
      "Colorado Territorial Correctional Facility",
    );
    expect(byCode.get("DRDC")?.name).toBe(
      "Denver Reception & Diagnostic Center",
    );
    expect(byCode.get("DWCF")?.name).toBe(
      "Denver Women's Correctional Facility",
    );
    expect(byCode.get("ICC/FED")?.name).toBe(
      "Federal Transfer / Interstate Compact Transfer",
    );
    expect(byCode.get("DENCOM WTM BDY")?.name).toBe(
      "Denver Community Westminster",
    );
    expect(byCode.get("ISP/DEN ENG")?.name).toBe("Denver Community Englewood");
    expect(resources.every(({ name }) => name !== null)).toBe(true);
  });

  it("has the resource types and kinds from Spec D", () => {
    expect(resourceTypes).toEqual([
      { code: "FACILITY", label: "Facility", sortOrder: 1 },
      { code: "COMMUNITY", label: "Community", sortOrder: 2 },
    ]);
    expect(kinds).toEqual([
      { code: "HEARING", label: "Hearing", sortOrder: 1 },
      { code: "FULL_BOARD", label: "Full Board", sortOrder: 2 },
      { code: "BUSINESS_MEETING", label: "Business Mtg", sortOrder: 3 },
    ]);
    expect(kinds.map(({ code }) => code)).toEqual(
      US_CO_PAROLE_BOARD_ENTRY_TYPES.map(({ code }) => code),
    );
  });

  it.each(SHEET)(
    "drafts %s hearings on the sheet's days and start time",
    (code, _typeCode, text, startTime) => {
      const pattern = hearingPatternFor(code);
      expect(describePatternRules(pattern.rules)).toBe(text);
      expect(pattern.rules.every(({ type }) => type === "weekOfMonth")).toBe(
        true,
      );
      expect(pattern.startTime).toBe(startTime);
      expect(pattern.endTime).toBeNull();
    },
  );

  it.each([
    ["ICC/FED", "10:00"],
    ["ISP FREMONT", "09:00"],
    ["LAMAR", "11:00"],
    ["SLV", "10:00"],
    ["STERCOM", "13:00"],
    ["FT. COLLINS", "10:00"],
    ["GREELEY", "10:00"],
  ])("starts %s hearings at %s", (code, startTime) => {
    expect(hearingPatternFor(code).startTime).toBe(startTime);
  });

  it("gives every pattern valid rules, an HH:mm start time and a unique slot key", () => {
    const slotKeys = patterns.map(entrySlotKey);
    expect(new Set(slotKeys).size).toBe(patterns.length);
    for (const { rules, startTime } of patterns) {
      expect(parsePatternRules(rules)).toEqual(rules);
      if (startTime !== null) expect(startTime).toMatch(/^\d{2}:\d{2}$/);
    }
  });

  it("names a resource on each HEARING pattern and none on a meeting", () => {
    const kindsByCode = new Map<string, CalendarEntryType>(
      US_CO_PAROLE_BOARD_ENTRY_TYPES.map((type) => [type.code, type]),
    );
    const resourcesByCode = new Map(resources.map((r) => [r.code, r]));
    for (const pattern of patterns) {
      const kind = kindsByCode.get(pattern.kindCode);
      if (!kind) throw new Error(`Unknown kind ${pattern.kindCode}`);
      const resource =
        pattern.resourceCode === null
          ? null
          : resourcesByCode.get(pattern.resourceCode);
      if (resource === undefined)
        throw new Error(`Unknown resource ${pattern.resourceCode}`);
      expect(() =>
        assertEntryShape({
          calendarId: "co",
          kind: { ...kind, calendarId: "co" },
          resource: resource && { ...resource, calendarId: "co" },
          isNew: true,
        }),
      ).not.toThrow();
    }
    expect(hearingPatterns).toHaveLength(37);
    expect(hearingPatterns.every(({ resourceCode }) => resourceCode)).toBe(
      true,
    );
  });

  it("drafts Full Board every Friday and the Business Meeting on the 3rd Friday", () => {
    expect(patterns.filter(({ kindCode }) => kindCode !== "HEARING")).toEqual([
      {
        kindCode: "FULL_BOARD",
        resourceCode: null,
        rules: [{ type: "everyWeekday", weekday: "FRIDAY" }],
        startTime: null,
        endTime: null,
      },
      {
        kindCode: "BUSINESS_MEETING",
        resourceCode: null,
        rules: [{ type: "weekOfMonth", week: 3, weekday: "FRIDAY" }],
        startTime: null,
        endTime: null,
      },
    ]);
  });
});
