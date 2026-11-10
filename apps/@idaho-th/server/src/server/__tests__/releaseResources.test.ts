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

import { releaseServerResources } from "~@idaho-th/server/server/releaseResources";

const destroyPdfSorterPoolMock = vi.hoisted(() => vi.fn());
const closeAndFlushMock = vi.hoisted(() => vi.fn());

vi.mock("~@idaho-th/trpc/pdfSorter/worker/pdfSorterPool", () => ({
  destroyPdfSorterPool: destroyPdfSorterPoolMock,
}));
vi.mock("~@idaho-th/trpc/routes/common/segment", () => ({
  segment: { closeAndFlush: closeAndFlushMock },
}));

beforeEach(() => {
  destroyPdfSorterPoolMock.mockReset().mockResolvedValue(undefined);
  closeAndFlushMock.mockReset().mockResolvedValue(undefined);
});

describe("releaseServerResources", () => {
  it("tears down the PDF pool, then flushes Segment", async () => {
    await releaseServerResources();

    expect(destroyPdfSorterPoolMock).toHaveBeenCalledOnce();
    expect(closeAndFlushMock).toHaveBeenCalledOnce();
    expect(closeAndFlushMock.mock.invocationCallOrder[0]).toBeGreaterThan(
      destroyPdfSorterPoolMock.mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it("still flushes Segment and rethrows when the pool teardown fails", async () => {
    const failure = new Error("pool teardown failed");
    destroyPdfSorterPoolMock.mockRejectedValue(failure);

    await expect(releaseServerResources()).rejects.toBe(failure);

    expect(closeAndFlushMock).toHaveBeenCalledOnce();
  });
});
