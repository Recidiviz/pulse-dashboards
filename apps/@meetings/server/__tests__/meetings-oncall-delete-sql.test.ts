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

import { describe, expect, test } from "vitest";

import { buildDeleteMeetingSql } from "~@meetings/server/scripts/meetings-oncall/delete-sql";

describe("buildDeleteMeetingSql", () => {
  test("a dry run ends in ROLLBACK and a commit run in COMMIT", () => {
    const dryRun = buildDeleteMeetingSql({
      meetingIds: ["abc123"],
      staffEmail: "someone@tn.gov",
      commit: false,
    });
    const committed = buildDeleteMeetingSql({
      meetingIds: ["abc123"],
      staffEmail: "someone@tn.gov",
      commit: true,
    });

    expect(dryRun.transaction.trim().endsWith("ROLLBACK;")).toBe(true);
    expect(dryRun.transaction).not.toContain("COMMIT");
    expect(committed.transaction.trim().endsWith("COMMIT;")).toBe(true);
    expect(committed.transaction).not.toContain("ROLLBACK");
  });

  test("deletes children before the meeting, since the foreign keys don't cascade", () => {
    const { transaction } = buildDeleteMeetingSql({
      meetingIds: ["abc123"],
      staffEmail: "someone@tn.gov",
      commit: false,
    });

    const order = [
      'DELETE FROM "Utterance"',
      'DELETE FROM "Transcription"',
      'DELETE FROM "MeetingActionItem"',
      'DELETE FROM "Meeting"',
    ].map((statement) => transaction.indexOf(statement));

    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  test("every delete is scoped to the owner's email, lowercased", () => {
    const { transaction } = buildDeleteMeetingSql({
      meetingIds: ["abc123"],
      staffEmail: "Some.One@TN.gov",
      commit: false,
    });

    const deletes = transaction.split("DELETE FROM").slice(1);
    expect(deletes).toHaveLength(4);
    deletes.forEach((statement) =>
      expect(statement).toContain(`lower("staffEmail") = 'some.one@tn.gov'`),
    );
  });

  test("dedupes meeting ids and expects one deleted row per meeting", () => {
    const { transaction } = buildDeleteMeetingSql({
      meetingIds: ["abc123", "def456", "abc123"],
      staffEmail: "someone@tn.gov",
      commit: false,
    });

    expect(transaction).toContain("-- expect: DELETE 2");
    expect(transaction).toContain(`IN ('abc123', 'def456')`);
  });

  test.each([
    ["a meeting id with a quote", ['x\'; DROP TABLE "Meeting"; --'], "a@b.c"],
    ["an email with a quote", ["abc123"], "a'@b.c"],
    ["an email without an @", ["abc123"], "not-an-email"],
    ["no meeting ids", [], "a@b.c"],
  ])("rejects %s", (_, meetingIds, staffEmail) => {
    expect(() =>
      buildDeleteMeetingSql({ meetingIds, staffEmail, commit: false }),
    ).toThrow();
  });
});
