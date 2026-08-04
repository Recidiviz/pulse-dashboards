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

import {
  deriveCounts,
  isTrivial,
  precisionRecallF1,
} from "~@meetings/eval-golden/llm-judge";

const pair = (truthIndex: number, predictedIndex: number) => ({
  truthIndex,
  predictedIndex,
});

describe("deriveCounts", () => {
  test("many-to-many matching: tp counts distinct truth items", () => {
    expect(
      deriveCounts(2, 2, {
        matches: [pair(0, 0), pair(0, 1), pair(1, 0)],
        acceptableMatches: [],
      }),
    ).toEqual({ tp: 2, fp: 0, fn: 0 });
  });

  test("out-of-range indices are dropped", () => {
    expect(
      deriveCounts(1, 1, {
        matches: [pair(-1, 0), pair(0, 1), pair(1, 0), pair(0, -2)],
        acceptableMatches: [],
      }),
    ).toEqual({ tp: 0, fp: 1, fn: 1 });
  });

  test("duplicate pairs are not double counted", () => {
    expect(
      deriveCounts(1, 2, {
        matches: [pair(0, 0), pair(0, 0)],
        acceptableMatches: [],
      }),
    ).toEqual({ tp: 1, fp: 1, fn: 0 });
  });

  test("acceptable list excuses unmatched predictions only", () => {
    // 0 already matched truth; 2 and 3 are excused; 9 and -1 are out of range;
    // 1 is left as the only false positive.
    expect(
      deriveCounts(1, 4, {
        matches: [pair(0, 0)],
        acceptableMatches: [0, 3, 2, 3, 9, -1],
      }),
    ).toEqual({ tp: 1, fp: 1, fn: 0 });
  });

  test("acceptable list can absorb every would-be false positive", () => {
    expect(
      deriveCounts(0, 2, { matches: [], acceptableMatches: [0, 1] }),
    ).toEqual({ tp: 0, fp: 0, fn: 0 });
  });
});

describe("precisionRecallF1", () => {
  test("computes standard P/R/F1", () => {
    expect(precisionRecallF1(1, 1, 1)).toEqual({
      precision: 0.5,
      recall: 0.5,
      f1: 0.5,
    });
  });

  test("degenerate empty/empty is a perfect score, not zero", () => {
    // No predictions means nothing wrong; no truth means nothing missed.
    expect(precisionRecallF1(0, 0, 0)).toEqual({
      precision: 1,
      recall: 1,
      f1: 1,
    });
  });

  test("only misses, or only hallucinations, score F1 0", () => {
    expect(precisionRecallF1(0, 0, 2)).toEqual({
      precision: 1,
      recall: 0,
      f1: 0,
    });
    expect(precisionRecallF1(0, 2, 0)).toEqual({
      precision: 0,
      recall: 1,
      f1: 0,
    });
  });
});

describe("isTrivial", () => {
  test("skips the judge when the outcome is already determined", () => {
    // Nothing predicted, so every truth item is a miss regardless of truth.
    expect(isTrivial(0, 0, 0)).toBe(true);
    expect(isTrivial(3, 0, 2)).toBe(true);
    // Predictions with no truth and nothing to excuse them: all false positives.
    expect(isTrivial(0, 2, 0)).toBe(true);
  });

  test("calls the judge when there is something to match", () => {
    expect(isTrivial(2, 3, 0)).toBe(false);
    // Empty truth with an acceptable list: the judge decides what it excuses.
    expect(isTrivial(0, 2, 1)).toBe(false);
  });
});
