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

import { firstFileFrame, runSynthetic } from "../src/handler";

const CLOUD_RUN_ENV = {
  K_SERVICE: "staff-synthetic-monitor-us-mi",
  K_REVISION: "staff-synthetic-monitor-us-mi-00042-xyz",
  K_CONFIGURATION: "staff-synthetic-monitor-us-mi",
  STAFF_TEST_PASSWORD: "hunter2",
};

describe("runSynthetic", () => {
  it("reports ok with timing and Cloud Run metadata when the body returns", async () => {
    const result = await runSynthetic(async () => undefined, CLOUD_RUN_ENV);

    expect(result.synthetic_generic_result_v1).toEqual({ ok: true });
    expect(Date.parse(result.start_time)).not.toBeNaN();
    expect(Date.parse(result.end_time)).toBeGreaterThanOrEqual(
      Date.parse(result.start_time),
    );
    // Only the Cloud Run identifiers, never other env vars such as credentials.
    expect(result.runtime_metadata).toEqual({
      K_SERVICE: "staff-synthetic-monitor-us-mi",
      K_REVISION: "staff-synthetic-monitor-us-mi-00042-xyz",
      K_CONFIGURATION: "staff-synthetic-monitor-us-mi",
    });
  });

  it("reports the error and where it was thrown when the body throws", async () => {
    const err = new TypeError("locator.waitFor: Timeout 30000ms exceeded.");
    err.stack = [
      "TypeError: locator.waitFor: Timeout 30000ms exceeded.",
      "    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)",
      "    at async verifyWorkflowsCaseload (/workspace/index.cjs:412:11)",
      "    at async /workspace/index.cjs:530:5",
    ].join("\n");

    const result = await runSynthetic(async () => {
      throw err;
    }, {});

    expect(result.synthetic_generic_result_v1).toEqual({
      ok: false,
      generic_error: {
        error_type: "TypeError",
        error_message: "locator.waitFor: Timeout 30000ms exceeded.",
        file_path: "/workspace/index.cjs",
        line: 412,
        function_name: "verifyWorkflowsCaseload",
        stack_trace: err.stack,
      },
    });
  });

  it("reports a thrown non-Error value as the message", async () => {
    const result = await runSynthetic(
      () => Promise.reject("browser crashed"),
      {},
    );

    expect(result.synthetic_generic_result_v1).toEqual({
      ok: false,
      generic_error: {
        error_type: "Error",
        error_message: "browser crashed",
        stack_trace: "",
      },
    });
  });
});

describe("firstFileFrame", () => {
  it("reads an anonymous frame", () => {
    expect(firstFileFrame("Error: x\n    at /workspace/index.cjs:9:3")).toEqual(
      {
        file_path: "/workspace/index.cjs",
        line: 9,
        function_name: undefined,
      },
    );
  });

  it("returns nothing when no frame has an absolute path", () => {
    expect(firstFileFrame("Error: x\n    at node:internal/foo:1:1")).toEqual(
      {},
    );
  });
});
