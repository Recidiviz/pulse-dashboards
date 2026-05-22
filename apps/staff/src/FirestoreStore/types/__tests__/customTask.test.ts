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

import { Timestamp } from "firebase/firestore";

import { customTaskSchema } from "../customTask";

const VALID_UUID = "8e58e96f-3a8d-4f2a-9fa6-1b1c3b4f0e2a";

function baseRecord() {
  return {
    id: VALID_UUID,
    title: "Contact employer",
    dueDate: Timestamp.fromDate(new Date("2026-06-01")),
    createdOn: Timestamp.fromDate(new Date("2026-05-14")),
    deletedOn: null,
    stateCode: "US_MO",
  };
}

describe("customTaskSchema", () => {
  test("parses a minimal valid record", () => {
    const record = baseRecord();
    const parsed = customTaskSchema.parse(record);
    expect(parsed.id).toBe(VALID_UUID);
    expect(parsed.title).toBe("Contact employer");
    expect(parsed.deletedOn).toBeNull();
  });

  test("trims whitespace from title", () => {
    const record = { ...baseRecord(), title: "  Trimmed title  " };
    expect(customTaskSchema.parse(record).title).toBe("Trimmed title");
  });

  test("rejects empty title", () => {
    expect(() =>
      customTaskSchema.parse({ ...baseRecord(), title: "" }),
    ).toThrow();
  });

  test("rejects whitespace-only title (post-trim)", () => {
    expect(() =>
      customTaskSchema.parse({ ...baseRecord(), title: "   " }),
    ).toThrow();
  });

  test("rejects 201-character title", () => {
    expect(() =>
      customTaskSchema.parse({ ...baseRecord(), title: "a".repeat(201) }),
    ).toThrow();
  });

  test("accepts a 200-character title", () => {
    const longTitle = "a".repeat(200);
    expect(
      customTaskSchema.parse({ ...baseRecord(), title: longTitle }).title,
    ).toBe(longTitle);
  });

  test("rejects missing required fields", () => {
    const { title, ...withoutTitle } = baseRecord();
    expect(() => customTaskSchema.parse(withoutTitle)).toThrow();

    const { dueDate, ...withoutDueDate } = baseRecord();
    expect(() => customTaskSchema.parse(withoutDueDate)).toThrow();

    const { stateCode, ...withoutStateCode } = baseRecord();
    expect(() => customTaskSchema.parse(withoutStateCode)).toThrow();
  });

  test("rejects invalid id", () => {
    expect(() =>
      customTaskSchema.parse({ ...baseRecord(), id: "not-a-uuid" }),
    ).toThrow();
  });

  test("accepts a completed record with completedOn set", () => {
    const completedOn = Timestamp.fromDate(new Date("2026-05-14"));
    const parsed = customTaskSchema.parse({
      ...baseRecord(),
      completedOn,
    });
    expect(parsed.completedOn).toEqual(completedOn);
  });

  test("accepts completedOn = null (reopened task)", () => {
    const parsed = customTaskSchema.parse({
      ...baseRecord(),
      completedOn: null,
    });
    expect(parsed.completedOn).toBeNull();
  });

  test("accepts deletedOn as a Timestamp (soft-deleted record)", () => {
    const deletedOn = Timestamp.fromDate(new Date("2026-05-15"));
    const parsed = customTaskSchema.parse({
      ...baseRecord(),
      deletedOn,
    });
    expect(parsed.deletedOn).toEqual(deletedOn);
  });

  test("accepts a JS Date in place of a Timestamp", () => {
    const due = new Date("2026-07-01");
    const parsed = customTaskSchema.parse({ ...baseRecord(), dueDate: due });
    expect(parsed.dueDate).toEqual(due);
  });

  test("rejects a non-Timestamp/non-Date dueDate", () => {
    expect(() =>
      customTaskSchema.parse({ ...baseRecord(), dueDate: "2026-06-01" }),
    ).toThrow();
  });

  test("defaults deletedOn to null when omitted", () => {
    const { deletedOn, ...rest } = baseRecord();
    expect(customTaskSchema.parse(rest).deletedOn).toBeNull();
  });

  test("accepts optional updatedOn", () => {
    const updatedOn = Timestamp.fromDate(new Date("2026-05-15"));
    const parsed = customTaskSchema.parse({
      ...baseRecord(),
      updatedOn,
    });
    expect(parsed.updatedOn).toEqual(updatedOn);
  });
});
