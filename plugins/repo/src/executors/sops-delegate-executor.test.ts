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

import { ExecutorContext } from "@nx/devkit";
import { spawnSync } from "child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import runSopsDelegateExecutor from "./sops-delegate-executor";

vi.mock("child_process", () => ({ spawnSync: vi.fn() }));

const spawnSyncMock = vi.mocked(spawnSync);

const PREFIXED_TARGET = "requires-sops-env:test-e2e";

function contextFor(): ExecutorContext {
  return {
    root: "/workspace",
    projectName: "staff",
    projectsConfigurations: {
      version: 2,
      projects: {
        staff: {
          root: "apps/staff",
          targets: { [PREFIXED_TARGET]: {} },
        },
      },
    },
  } as unknown as ExecutorContext;
}

// The delegated target's exit status has to reach Nx, or a red target reports
// green.
describe("sops delegate executor reports the delegated target's result", () => {
  beforeEach(() => {
    process.env["NX_SKIP_SOPS"] = "true";
  });

  afterEach(() => {
    delete process.env["NX_SKIP_SOPS"];
  });

  it("fails when the delegated target exits non-zero", async () => {
    spawnSyncMock.mockReturnValue({ status: 1 } as ReturnType<
      typeof spawnSync
    >);

    const result = await runSopsDelegateExecutor(
      { prefixedTarget: PREFIXED_TARGET },
      contextFor(),
    );

    expect(result).toEqual({ success: false });
  });

  it("succeeds when the delegated target exits zero", async () => {
    spawnSyncMock.mockReturnValue({ status: 0 } as ReturnType<
      typeof spawnSync
    >);

    const result = await runSopsDelegateExecutor(
      { prefixedTarget: PREFIXED_TARGET },
      contextFor(),
    );

    expect(result).toEqual({ success: true });
  });

  it("fails when the delegated target cannot be spawned at all", async () => {
    spawnSyncMock.mockReturnValue({
      status: null,
      error: new Error("spawn nx ENOENT"),
    } as ReturnType<typeof spawnSync>);

    const result = await runSopsDelegateExecutor(
      { prefixedTarget: PREFIXED_TARGET },
      contextFor(),
    );

    expect(result).toEqual({ success: false });
  });
});
