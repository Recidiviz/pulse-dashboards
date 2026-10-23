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

import { CalendarRulesError } from "../errors";
import {
  assertCancellable,
  assertEntryShape,
  entrySlotKey,
  InvalidEntryError,
} from "./entries";

const CALENDAR_ID = "cal-parole-board";
const HEARING = {
  calendarId: CALENDAR_ID,
  code: "HEARING",
  requiresResource: true,
  cancellable: false,
};
const FULL_BOARD = {
  calendarId: CALENDAR_ID,
  code: "FULL_BOARD",
  requiresResource: false,
  cancellable: true,
};
const FCF = { calendarId: CALENDAR_ID, code: "FCF", isActive: true };

/** Matches the INVALID_ENTRY error with this reason. */
function invalidEntry(reason: string) {
  return expect.objectContaining({ code: "INVALID_ENTRY", reason });
}

describe("entrySlotKey", () => {
  it.each([
    ["HEARING", "FCF", "HEARING:FCF"],
    ["HEARING", "ICC/FED", "HEARING:ICC/FED"],
    ["FULL_BOARD", null, "FULL_BOARD"],
  ])("returns the slot key for %s at %s", (kindCode, resourceCode, slotKey) => {
    expect(entrySlotKey({ kindCode, resourceCode })).toBe(slotKey);
  });

  it.each([
    ["an empty kind code", { kindCode: "", resourceCode: "FCF" }],
    ["an empty resource code", { kindCode: "HEARING", resourceCode: "" }],
    ["a kind code with a colon", { kindCode: "HEAR:ING", resourceCode: null }],
    [
      "a resource code with a colon",
      { kindCode: "HEARING", resourceCode: "F:CF" },
    ],
  ])("throws for %s", (_name, codes) => {
    expect(() => entrySlotKey(codes)).toThrow(invalidEntry("INVALID_CODE"));
  });
});

describe("assertEntryShape", () => {
  it("passes a HEARING at FCF", () => {
    expect(() =>
      assertEntryShape({
        calendarId: CALENDAR_ID,
        kind: HEARING,
        resource: FCF,
        isNew: true,
      }),
    ).not.toThrow();
  });

  it("passes a FULL_BOARD with no resource", () => {
    expect(() =>
      assertEntryShape({
        calendarId: CALENDAR_ID,
        kind: FULL_BOARD,
        resource: null,
        isNew: true,
      }),
    ).not.toThrow();
  });

  it("passes an existing entry on an inactive resource", () => {
    expect(() =>
      assertEntryShape({
        calendarId: CALENDAR_ID,
        kind: HEARING,
        resource: { ...FCF, isActive: false },
        isNew: false,
      }),
    ).not.toThrow();
  });

  it.each([
    ["RESOURCE_REQUIRED", { kind: HEARING, resource: null, isNew: true }],
    ["RESOURCE_NOT_ALLOWED", { kind: FULL_BOARD, resource: FCF, isNew: true }],
    [
      "CALENDAR_MISMATCH",
      {
        kind: { ...HEARING, calendarId: "cal-other" },
        resource: FCF,
        isNew: true,
      },
    ],
    [
      "CALENDAR_MISMATCH",
      {
        kind: HEARING,
        resource: { ...FCF, calendarId: "cal-other" },
        isNew: false,
      },
    ],
    [
      "INACTIVE_RESOURCE",
      { kind: HEARING, resource: { ...FCF, isActive: false }, isNew: true },
    ],
  ])("throws %s", (reason, args) => {
    expect(() =>
      assertEntryShape({ calendarId: CALENDAR_ID, ...args }),
    ).toThrow(invalidEntry(reason));
  });

  it("throws an error that is also a CalendarRulesError", () => {
    expect(() =>
      assertEntryShape({
        calendarId: CALENDAR_ID,
        kind: HEARING,
        resource: null,
        isNew: true,
      }),
    ).toThrow(CalendarRulesError);
  });
});

describe("assertCancellable", () => {
  it("throws NOT_CANCELLABLE for HEARING", () => {
    expect(() => assertCancellable(HEARING)).toThrow(
      invalidEntry("NOT_CANCELLABLE"),
    );
  });

  it("passes for FULL_BOARD", () => {
    expect(() => assertCancellable(FULL_BOARD)).not.toThrow();
  });

  it("throws an InvalidEntryError", () => {
    expect(() => assertCancellable(HEARING)).toThrow(InvalidEntryError);
  });
});
