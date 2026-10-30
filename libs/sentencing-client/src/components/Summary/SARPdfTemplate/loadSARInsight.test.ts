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

import { describe, expect, it, vi } from "vitest";

import { loadSARInsight } from "./loadSARInsight";
import type { SAR } from "./SARPdfTemplate.types";

const sar = { id: "sar-1" } as unknown as SAR;

function makeApiClient() {
  return { getSARInsight: vi.fn() };
}

describe("loadSARInsight", () => {
  it("fetches the insight by SAR id", async () => {
    const insight = { dispositionData: [] };
    const apiClient = makeApiClient();
    apiClient.getSARInsight.mockResolvedValue(insight);

    const result = await loadSARInsight(apiClient, sar);

    expect(apiClient.getSARInsight).toHaveBeenCalledWith("sar-1");
    expect(result).toBe(insight);
  });

  it("returns null when no insight exists", async () => {
    const apiClient = makeApiClient();
    apiClient.getSARInsight.mockResolvedValue(undefined);
    const result = await loadSARInsight(apiClient, sar);
    expect(result).toBeNull();
  });

  it("returns null when getSARInsight throws", async () => {
    const apiClient = makeApiClient();
    apiClient.getSARInsight.mockRejectedValue(new Error("trpc kablooie"));
    const result = await loadSARInsight(apiClient, sar);
    expect(result).toBeNull();
  });
});
