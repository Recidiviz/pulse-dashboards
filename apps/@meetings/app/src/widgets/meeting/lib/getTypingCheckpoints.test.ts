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

import { getTypingCheckpoints } from "./getTypingCheckpoints";

const reveal = (text: string, wordsPerChunk: number) =>
  getTypingCheckpoints(text, wordsPerChunk).map(({ end }) =>
    text.slice(0, end),
  );

describe("getTypingCheckpoints", () => {
  it("returns no checkpoints for an empty note", () => {
    expect(getTypingCheckpoints("", 4)).toEqual([]);
    expect(getTypingCheckpoints("  \n\n ", 4)).toEqual([]);
  });

  it("reveals the text a few words at a time", () => {
    expect(reveal("one two three four five six seven", 3)).toEqual([
      "one two three",
      "one two three four five six",
      "one two three four five six seven",
    ]);
  });

  it("ends a chunk at a section break and marks it", () => {
    const text = "SUMMARY: one two\n\nHOUSING: three four five";
    const checkpoints = getTypingCheckpoints(text, 4);

    expect(reveal(text, 4)).toEqual([
      "SUMMARY: one two",
      "SUMMARY: one two\n\nHOUSING: three four five",
    ]);
    expect(checkpoints.map(({ endsSection }) => endsSection)).toEqual([
      true,
      true,
    ]);
  });

  it("does not treat a single newline as a section break", () => {
    const checkpoints = getTypingCheckpoints("one two\nthree four", 4);

    expect(checkpoints).toEqual([{ end: 18, endsSection: true }]);
  });

  it("keeps the original whitespace between words", () => {
    const text = "one  two\n\n\nthree";

    expect(reveal(text, 1)).toEqual(["one", "one  two", text]);
  });

  it.each([
    ["spaces before the blank line", "  \n\n"],
    ["spaces on the blank line", "\n  \n"],
    ["spaces everywhere", "  \n  \n  "],
    ["several blank lines", "\n\n\n\n"],
    ["tabs and Windows line endings", "\t\r\n\t\r\n\t"],
  ])("finds the section break with %s", (_, gap) => {
    const firstSection = "SUMMARY: a b c";
    const text = `${firstSection}${gap}HOUSING: d e`;

    // The pause comes right after the last word, and the gap is revealed
    // as-is together with the next section
    expect(getTypingCheckpoints(text, 4)).toEqual([
      { end: firstSection.length, endsSection: true },
      { end: text.length, endsSection: true },
    ]);
  });

  it.each([
    ["spaces before a line break", "  \n"],
    ["spaces around a line break", "  \n  "],
    ["a Windows line break", "\r\n"],
  ])("does not treat %s as a section break", (_, gap) => {
    const text = `one two${gap}three four`;

    expect(getTypingCheckpoints(text, 2)).toEqual([
      { end: "one two".length, endsSection: false },
      { end: text.length, endsSection: true },
    ]);
  });
});
