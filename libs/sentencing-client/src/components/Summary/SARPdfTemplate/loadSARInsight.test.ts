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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAssessmentScoreBucket } from "../../OffenderAssessment/assessmentTypeUtils";
import { loadSARInsight } from "./loadSARInsight";
import type { SAR } from "./SARPdfTemplate.types";

vi.mock("../../OffenderAssessment/assessmentTypeUtils", () => ({
  getAssessmentScoreBucket: vi.fn(),
}));

const mockBucket = vi.mocked(getAssessmentScoreBucket);

/** Minimal SAR carrying only the fields the insight derivation reads. */
function makeSAR(overrides: Partial<SAR> = {}): SAR {
  return {
    assessmentDate: new Date("2026-01-15"),
    mostSevereOffenseName: "POSSESSION OF CONTROLLED SUBSTANCE",
    assessmentScore: 20,
    assessmentType: "ORAS_CST",
    client: { gender: "MALE" },
    ...overrides,
  } as unknown as SAR;
}

function makeApiClient() {
  return { getSARInsight: vi.fn() };
}

describe("loadSARInsight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBucket.mockReturnValue(2);
  });

  it("returns null (and skips the fetch) when assessmentDate is missing", async () => {
    const apiClient = makeApiClient();
    const result = await loadSARInsight(
      apiClient,
      makeSAR({ assessmentDate: null }),
    );
    expect(result).toBeNull();
    expect(apiClient.getSARInsight).not.toHaveBeenCalled();
  });

  it.each([
    ["offense", { mostSevereOffenseName: null }],
    ["gender", { client: null }],
    ["score", { assessmentScore: null }],
    ["assessment type", { assessmentType: null }],
  ])("returns null when %s is missing", async (_field, overrides) => {
    const apiClient = makeApiClient();
    const result = await loadSARInsight(
      apiClient,
      makeSAR(overrides as Partial<SAR>),
    );
    expect(result).toBeNull();
    expect(apiClient.getSARInsight).not.toHaveBeenCalled();
  });

  it("returns null when the score bucket cannot be determined", async () => {
    mockBucket.mockReturnValue(null);
    const apiClient = makeApiClient();
    const result = await loadSARInsight(apiClient, makeSAR());
    expect(result).toBeNull();
    expect(apiClient.getSARInsight).not.toHaveBeenCalled();
  });

  it("fetches the insight with the derived bucket on the happy path", async () => {
    const insight = { dispositionData: [] };
    const apiClient = makeApiClient();
    apiClient.getSARInsight.mockResolvedValue(insight);

    const result = await loadSARInsight(apiClient, makeSAR());

    expect(apiClient.getSARInsight).toHaveBeenCalledWith(
      "POSSESSION OF CONTROLLED SUBSTANCE",
      "MALE",
      2,
    );
    expect(result).toBe(insight);
  });

  it("returns null when getSARInsight throws", async () => {
    const apiClient = makeApiClient();
    apiClient.getSARInsight.mockRejectedValue(new Error("trpc kablooie"));
    const result = await loadSARInsight(apiClient, makeSAR());
    expect(result).toBeNull();
  });
});
