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

import { diffText } from "./textDiff";

function rendered(before: string, after: string) {
  const { parts } = diffText(before, after);
  return {
    added: parts
      .filter((p) => p.type === "added")
      .map((p) => p.value)
      .join(""),
    removed: parts
      .filter((p) => p.type === "removed")
      .map((p) => p.value)
      .join(""),
  };
}

describe("diffText", () => {
  it("reports no changes for identical text", () => {
    const { parts, tooLarge } = diffText("same text", "same text");

    expect(tooLarge).toBe(false);
    expect(parts.every((p) => p.type === "unchanged")).toBe(true);
  });

  it("marks inserted words", () => {
    expect(rendered("Met with client.", "Met with the client.")).toEqual({
      added: "the ",
      removed: "",
    });
  });

  it("marks deleted words", () => {
    expect(rendered("Met with the client.", "Met with client.")).toEqual({
      added: "",
      removed: "the ",
    });
  });

  it("marks a replacement as both a deletion and an insertion", () => {
    const { added, removed } = rendered(
      "Discussed housing.",
      "Discussed employment.",
    );

    expect(added).toContain("employment");
    expect(removed).toContain("housing");
  });

  it("treats an empty original as all additions", () => {
    expect(rendered("", "A brand new note.")).toEqual({
      added: "A brand new note.",
      removed: "",
    });
  });

  it("preserves whitespace so the reassembled text matches the input", () => {
    const before = "Line one.\n\nLine two.";
    const after = "Line one.\n\nLine two, revised.";
    const { parts } = diffText(before, after);

    const reassembled = parts
      .filter((p) => p.type !== "removed")
      .map((p) => p.value)
      .join("");
    expect(reassembled).toBe(after);
  });

  it("skips the diff when either side is too long to be worth rendering", () => {
    const huge = "word ".repeat(20_000);

    const { parts, tooLarge } = diffText(huge, `${huge}extra`);

    expect(tooLarge).toBe(true);
    expect(parts).toEqual([]);
  });
});
