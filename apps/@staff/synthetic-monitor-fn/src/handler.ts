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

// Wraps the monitor's test body as the HTTP handler a GCP Synthetic Monitor
// invokes, and serves the SyntheticResult JSON the uptime check reads to decide
// pass or fail. The body passes by returning and fails by throwing:
//
//   { "synthetic_generic_result_v1": { "ok": false, "generic_error": {
//       "error_type": "TimeoutError",
//       "error_message": "locator.waitFor: Timeout 30000ms exceeded.",
//       "file_path": "/workspace/index.cjs", "line": 412,
//       "function_name": "verifyWorkflowsCaseload", "stack_trace": "..." } },
//     "start_time": "2026-11-06T18:36:20.112Z",
//     "end_time": "2026-11-06T18:37:24.903Z",
//     "runtime_metadata": { "K_SERVICE": "staff-synthetic-monitor-us-mi", ... } }
//
// The field names match runSyntheticHandler from @google-cloud/synthetics-sdk-api,
// which this replaces; see
// https://cloud.google.com/monitoring/synthetic-monitors/create.

export interface GenericError {
  error_type: string;
  error_message: string;
  file_path?: string;
  line?: number;
  function_name?: string;
  stack_trace: string;
}

export interface SyntheticResult {
  synthetic_generic_result_v1: {
    ok: boolean;
    generic_error?: GenericError;
  };
  start_time: string;
  end_time: string;
  runtime_metadata: Record<string, string>;
}

/** The part of the functions-framework (Express) response the handler uses. */
interface SyntheticResponse {
  send(body: SyntheticResult): void;
}

// Cloud Run sets these on every instance; Cloud Monitoring shows them with the
// execution.
const RUNTIME_METADATA_ENV_VARS = [
  "K_SERVICE",
  "K_REVISION",
  "K_CONFIGURATION",
];

// A V8 stack frame, e.g. "    at verify (/workspace/index.cjs:412:11)" or
// "    at async /workspace/index.cjs:530:5".
const STACK_FRAME_PATTERN =
  /^\s*at (?:(?:async )?(.+?) \()?(?:async )?(\/[^()]+):(\d+):\d+\)?$/;

/**
 * Returns the location of the first stack frame in an absolute file path, which
 * skips node:internal frames and points at the monitor's own code.
 */
export function firstFileFrame(
  stack: string,
): Pick<GenericError, "file_path" | "line" | "function_name"> {
  for (const line of stack.split("\n")) {
    const match = STACK_FRAME_PATTERN.exec(line);
    if (match) {
      const [, functionName, filePath, lineNumber] = match;
      return {
        file_path: filePath,
        line: Number(lineNumber),
        function_name: functionName,
      };
    }
  }
  return {};
}

function toGenericError(err: unknown): GenericError {
  if (err instanceof Error) {
    const stack = err.stack ?? "";
    return {
      error_type: err.name,
      error_message: err.message,
      ...firstFileFrame(stack),
      stack_trace: stack,
    };
  }
  return { error_type: "Error", error_message: String(err), stack_trace: "" };
}

function runtimeMetadata(env: NodeJS.ProcessEnv): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (const name of RUNTIME_METADATA_ENV_VARS) {
    const value = env[name];
    if (value) metadata[name] = value;
  }
  return metadata;
}

/** Runs body once and returns its SyntheticResult; never throws. */
export async function runSynthetic(
  body: () => Promise<void>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<SyntheticResult> {
  const startTime = new Date().toISOString();
  let result: SyntheticResult["synthetic_generic_result_v1"];
  try {
    await body();
    result = { ok: true };
  } catch (err) {
    result = { ok: false, generic_error: toGenericError(err) };
  }
  return {
    synthetic_generic_result_v1: result,
    start_time: startTime,
    end_time: new Date().toISOString(),
    runtime_metadata: runtimeMetadata(env),
  };
}

/** Returns the HTTP handler to export as the Cloud Function's entry point. */
export function runSyntheticHandler(
  body: () => Promise<void>,
): (req: unknown, res: SyntheticResponse) => Promise<void> {
  return async (_req, res) => {
    res.send(await runSynthetic(body));
  };
}
