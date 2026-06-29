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

import inquirer from "inquirer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deployWithRetry } from "./deploy-with-retry.mts";

vi.mock("inquirer", () => ({ default: { prompt: vi.fn() } }));

const promptMock = vi.mocked(inquirer.prompt);

beforeEach(() => {
  promptMock.mockReset();
});

describe("deployWithRetry", () => {
  it("returns true once on success without prompting", async () => {
    const task = vi.fn().mockResolvedValue(undefined);

    const result = await deployWithRetry("Sentencing", task);

    expect(result).toBe(true);
    expect(task).toHaveBeenCalledTimes(1);
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("returns false and stops when the user declines a retry", async () => {
    const task = vi.fn().mockRejectedValue(new Error("boom"));
    promptMock.mockResolvedValueOnce({ retry: false });

    const result = await deployWithRetry("Sentencing", task);

    expect(result).toBe(false);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("retries then returns true exactly once when a retry succeeds", async () => {
    // The pre-modularization fixtures loop got this case wrong (it looped forever and
    // recorded duplicates); this pins the corrected behavior.
    const task = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    promptMock.mockResolvedValueOnce({ retry: true });

    const result = await deployWithRetry("Sentencing", task);

    expect(result).toBe(true);
    expect(task).toHaveBeenCalledTimes(2);
    expect(promptMock).toHaveBeenCalledTimes(1);
  });
});
