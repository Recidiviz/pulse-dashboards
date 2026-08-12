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

import { CaseNoteSummarySegment } from "../model/types";
import { toWords } from "./toWords";

const plain = (content: string): CaseNoteSummarySegment => ({ content });

const cited = (content: string): CaseNoteSummarySegment => ({
  content,
  citation: { quotes: [`quote for ${content}`] },
});

const texts = (segments: CaseNoteSummarySegment[]) =>
  toWords(segments).map(({ text }) => text);

describe("toWords", () => {
  it("returns nothing for no segments", () => {
    expect(toWords([])).toEqual([]);
  });

  it("splits a segment into words that keep their trailing space", () => {
    expect(texts([plain("Mike Woods ")])).toEqual(["Mike ", "Woods "]);
  });

  it("keeps hyphenated and punctuated words intact", () => {
    expect(texts([plain("is employed part-time at C.J. Diner.")])).toEqual([
      "is ",
      "employed ",
      "part-time ",
      "at ",
      "C.J. ",
      "Diner.",
    ]);
  });

  it("marks every word of a cited segment as cited", () => {
    expect(toWords([cited("is housed")])).toEqual([
      { text: "is ", segmentIndex: 0, isCited: true },
      { text: "housed", segmentIndex: 0, isCited: true },
    ]);
  });

  it("splits off a cited segment's leading space as uncited", () => {
    // Otherwise the underline starts one space ahead of the cited phrase.
    expect(toWords([cited(" at 123 Jackson St")])).toEqual([
      { text: " ", segmentIndex: 0, isCited: false },
      { text: "at ", segmentIndex: 0, isCited: true },
      { text: "123 ", segmentIndex: 0, isCited: true },
      { text: "Jackson ", segmentIndex: 0, isCited: true },
      { text: "St", segmentIndex: 0, isCited: true },
    ]);
  });

  it("keeps an uncited segment's leading space attached to its first word", () => {
    expect(texts([plain(" and ")])).toEqual([" and "]);
  });

  it("tags each word with the index of the segment it came from", () => {
    const words = toWords([
      plain("Mike Woods "),
      cited("is employed"),
      plain("."),
    ]);

    expect(words.map(({ text, segmentIndex }) => [text, segmentIndex])).toEqual(
      [
        ["Mike ", 0],
        ["Woods ", 0],
        ["is ", 1],
        ["employed", 1],
        [".", 2],
      ],
    );
  });

  it("keeps whitespace-only and empty segments rather than dropping them", () => {
    expect(texts([plain("  "), plain("")])).toEqual(["  ", ""]);
  });

  it("preserves the original sentence when the words are joined back together", () => {
    const segments = [
      plain("Mike Woods "),
      cited("is employed"),
      cited(" part-time"),
      plain("  "),
      cited(" at Diner"),
      plain("."),
    ];

    expect(texts(segments).join("")).toBe(
      segments.map(({ content }) => content).join(""),
    );
  });
});
