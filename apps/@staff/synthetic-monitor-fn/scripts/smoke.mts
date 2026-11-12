#!/usr/bin/env tsx
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

// Smoke-test the synthetic monitor locally. For each state:
//   1. decrypt environments/<env>/<STATE>.enc.yaml for its { username, password },
//   2. launch the functions-framework server for the state (env wired up),
//   3. issue a single request and report PASS/FAIL,
//   4. stop the server.
//
// With --state, runs that one state (and prints the full SyntheticResult). Without
// --state, sweeps EVERY state in the environment (up to --concurrency at a time)
// and prints a summary; exits non-zero if any failed.
//
// Run via nx (builds first); --help lists every option. Pick the environment
// with -c rather than -- --env, because nx treats --env as its own option:
//   nx smoke '@staff/synthetic-monitor-fn'                       # all staging states
//   nx smoke '@staff/synthetic-monitor-fn' -c production         # all production states
//   nx smoke '@staff/synthetic-monitor-fn' -- --state US_MI --headed --slowmo 250
//   nx smoke '@staff/synthetic-monitor-fn' -- --concurrency 8    # sweep, 8 states at a time
//   nx smoke '@staff/synthetic-monitor-fn' -- --help
// Each option that configures the function itself also reads the env var the
// function reads (e.g. --headed or HEADED=true); the flag wins when both are set.

import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";

import {
  Command,
  InvalidArgumentError,
  Option,
} from "@commander-js/extra-typings";
import chalk from "chalk";

const APP_URLS: Record<string, string> = {
  staging: "https://dashboard-staging.recidiviz.org",
  production: "https://dashboard.recidiviz.org",
};

const COMPONENT_ENV_DIR =
  "libs/atmos/components/terraform/apps/staff-synthetic-monitor/environments";

const READY_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 180_000;

// The function returns a Synthetics SDK SyntheticResult.
interface SyntheticResult {
  synthetic_generic_result_v1?: {
    ok?: boolean;
    generic_error?: {
      error_type?: string;
      error_message?: string;
      stack_trace?: string;
    };
  };
}

function fail(message: string): never {
  process.stderr.write(`${chalk.red(message)}\n`);
  process.exit(1);
}

/**
 * Forwards the server's output to our stderr, line-prefixed so it's distinct.
 * The prefix carries the state code so concurrently-running servers stay
 * distinguishable when their logs interleave.
 */
function pipeServerLogs(server: ChildProcess, state: string): void {
  const prefix = chalk.dim(`│ ${state}`);
  const forward = (stream: NodeJS.ReadableStream | null): void => {
    if (!stream) return;
    let buffer = "";
    stream.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        process.stderr.write(`${prefix} ${chalk.dim(line)}\n`);
      }
    });
  };
  forward(server.stdout);
  forward(server.stderr);
}

function printPass(label: string, elapsedSeconds: string): void {
  process.stderr.write(
    `\n${chalk.bold.green("✔ PASS")} ${label} ${chalk.dim(`(${elapsedSeconds}s)`)}\n`,
  );
}

/** Red FAIL banner + the error (readably) — `detail` may be a multi-line message. */
function printFail(
  label: string,
  detail: string,
  elapsedSeconds?: string,
): void {
  const time = elapsedSeconds ? chalk.dim(` (${elapsedSeconds}s)`) : "";
  process.stderr.write(`\n${chalk.bold.red("✘ FAIL")} ${label}${time}\n`);
  if (detail) {
    process.stderr.write(`${chalk.red(detail.trim())}\n`);
  }
}

/** Returns whether an env var is "true" or "1", the values the function accepts. */
function envFlag(name: string): boolean {
  const value = process.env[name]?.toLowerCase();
  return value === "true" || value === "1";
}

function positiveInt(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError("Expected a positive integer.");
  }
  return parsed;
}

// Commander's Option.env() sets a boolean flag whenever its env var is defined
// at all, so HEADED=false would enable it. Boolean flags take their default from
// envFlag instead; only options with a value use .env().
const program = new Command()
  .name("smoke")
  .description(
    "Run the synthetic monitor locally against a deployed dashboard, once per state.\n" +
      "Decrypts each state's test-user credentials with sops, so gcloud auth is required.",
  )
  .addOption(
    new Option("--env <env>", "dashboard environment to test")
      .choices(["staging", "production"] as const)
      .default("staging" as const),
  )
  .option(
    "--state <code>",
    "run one state (e.g. US_MI) and print its full SyntheticResult; omit to sweep every state",
  )
  .option(
    "--concurrency <n>",
    "number of states to run at once when sweeping",
    positiveInt,
    4,
  )
  .option(
    "--port <n>",
    "first local port; each state gets port + index",
    positiveInt,
    8080,
  )
  .addOption(
    new Option("--headed", "show the browser window (env: HEADED)").default(
      envFlag("HEADED"),
    ),
  )
  .addOption(
    new Option("--slowmo <ms>", "delay each browser action by ms")
      .env("SLOWMO")
      .argParser(positiveInt),
  )
  .addOption(
    new Option(
      "--no-verbose",
      "turn off the function's step-by-step logs, which smoke turns on by default (env: VERBOSE)",
    ).default(process.env["VERBOSE"] === undefined || envFlag("VERBOSE")),
  )
  .addOption(
    new Option(
      "--trace",
      "record a HAR of each run, kept on failure (env: TRACE)",
    ).default(envFlag("TRACE")),
  )
  .addOption(
    new Option(
      "--chromium-path <path>",
      "Chromium binary to launch instead of the system Google Chrome",
    ).env("CHROMIUM_EXECUTABLE_PATH"),
  )
  .addOption(
    new Option(
      "--screenshot-dir <dir>",
      "where failure screenshots are saved; the OS temp dir if unset",
    ).env("SCREENSHOT_DIR"),
  )
  .addOption(
    new Option(
      "--screenshot-bucket <bucket>",
      "upload failure screenshots and HARs to this GCS bucket instead of saving them locally",
    ).env("SCREENSHOT_BUCKET"),
  );

type SmokeOptions = ReturnType<typeof program.opts>;

/** Translates the CLI options into the env vars the function reads. */
function functionEnv(options: SmokeOptions): Record<string, string> {
  const env: Record<string, string> = {
    HEADED: String(options.headed),
    VERBOSE: String(options.verbose),
    TRACE: String(options.trace),
  };
  if (options.slowmo !== undefined) env["SLOWMO"] = String(options.slowmo);
  if (options.chromiumPath) {
    env["CHROMIUM_EXECUTABLE_PATH"] = options.chromiumPath;
  }
  if (options.screenshotDir) env["SCREENSHOT_DIR"] = options.screenshotDir;
  if (options.screenshotBucket) {
    env["SCREENSHOT_BUCKET"] = options.screenshotBucket;
  }
  return env;
}

function loadCredentials(sopsFile: string): {
  username: string;
  password: string;
} {
  let stdout: string;
  try {
    stdout = execFileSync(
      "sops",
      ["--decrypt", "--output-type", "json", sopsFile],
      { encoding: "utf8" },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to decrypt ${sopsFile} with sops: ${message}`);
  }

  const decoded: unknown = JSON.parse(stdout);
  const username = (decoded as Record<string, unknown>)?.["username"];
  const password = (decoded as Record<string, unknown>)?.["password"];
  if (typeof username !== "string" || typeof password !== "string") {
    throw new Error(
      `${sopsFile} must decrypt to a { username, password } map.`,
    );
  }
  return { username, password };
}

/** Resolves once the port accepts a TCP connection (server is listening). */
function waitForPort(port: number): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  return new Promise((resolve, reject) => {
    const attempt = (): void => {
      const socket = net.connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(
            new Error(`server did not start within ${READY_TIMEOUT_MS}ms`),
          );
        } else {
          setTimeout(attempt, 250);
        }
      });
    };
    attempt();
  });
}

/** Absolute path to the functions-framework CLI entry (a root devDependency). */
function functionsFrameworkCli(workspaceRoot: string): string {
  const requireFromRoot = createRequire(
    path.join(workspaceRoot, "package.json"),
  );
  let mainEntry: string;
  try {
    mainEntry = requireFromRoot.resolve("@google-cloud/functions-framework");
  } catch {
    return fail(
      "@google-cloud/functions-framework is not installed. Run `yarn install`.",
    );
  }
  // The CLI (main.js) sits next to the package main (index.js) under build/src.
  return path.join(path.dirname(mainEntry), "main.js");
}

/** Lists the state codes that have a SOPS file in environments/<env>/. */
function listStates(envDir: string): string[] {
  return readdirSync(envDir)
    .filter((f) => f.endsWith(".enc.yaml"))
    .map((f) => f.replace(/\.enc\.yaml$/, ""))
    .sort();
}

interface RunOptions {
  env: string;
  state: string;
  port: number;
  workspaceRoot: string;
  sourceDir: string;
  /** When true, also pretty-print the full SyntheticResult to stdout. */
  printResult: boolean;
  /** Env vars from the CLI options, passed to the function's server. */
  extraEnv: Record<string, string>;
}

/** Runs the function once for one state; returns whether the check passed. */
async function runSmoke(opts: RunOptions): Promise<boolean> {
  const { env, state, port, workspaceRoot, sourceDir, printResult, extraEnv } =
    opts;
  const label = `${chalk.bold(state)} ${chalk.dim(`(${env})`)}`;
  const sopsFile = path.join(
    workspaceRoot,
    COMPONENT_ENV_DIR,
    env,
    `${state}.enc.yaml`,
  );

  let username: string;
  let password: string;
  try {
    ({ username, password } = loadCredentials(sopsFile));
  } catch (err) {
    printFail(label, err instanceof Error ? err.message : String(err));
    return false;
  }

  process.stderr.write(
    `\n${chalk.bold.cyan("▶ smoke")} ${label} ${chalk.dim(`→ port ${port}`)}\n`,
  );

  const server = spawn(
    process.execPath,
    [
      functionsFrameworkCli(workspaceRoot),
      "--target=SyntheticFunction",
      `--source=${sourceDir}`,
      `--port=${port}`,
    ],
    {
      cwd: workspaceRoot,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ...extraEnv,
        STAFF_APP_URL: APP_URLS[env],
        STATE_CODE: state,
        STAFF_TEST_USER: username,
        STAFF_TEST_PASSWORD: password,
      },
    },
  );
  pipeServerLogs(server, state);
  let serverError: Error | undefined;
  server.once("error", (err) => {
    serverError = err;
  });

  const startedAt = Date.now();
  try {
    await waitForPort(port);
    if (serverError) throw serverError;
    process.stderr.write(chalk.dim("  server ready — issuing request…\n"));

    const response = await fetch(`http://localhost:${port}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.text();
    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    const result = JSON.parse(body) as SyntheticResult;

    if (printResult) {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }

    const ok = result.synthetic_generic_result_v1?.ok === true;
    if (ok) {
      printPass(label, elapsedSeconds);
    } else {
      const message =
        result.synthetic_generic_result_v1?.generic_error?.error_message ??
        "unknown error";
      printFail(label, message, elapsedSeconds);
    }
    return ok;
  } catch (err) {
    const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    printFail(
      label,
      err instanceof Error ? err.message : String(err),
      elapsedSeconds,
    );
    return false;
  } finally {
    server.kill("SIGTERM");
  }
}

async function main(): Promise<void> {
  const options = program.parse().opts();
  const { env, concurrency, port: basePort } = options;
  const requestedState = (options.state ?? "").toUpperCase();
  const extraEnv = functionEnv(options);

  const workspaceRoot =
    process.env["NX_WORKSPACE_ROOT"] ?? path.resolve(process.cwd(), "../../..");
  const sourceDir = path.join(
    workspaceRoot,
    "dist/apps/@staff/synthetic-monitor-fn",
  );
  const envDir = path.join(workspaceRoot, COMPONENT_ENV_DIR, env);

  // No --state → sweep every state in the environment.
  const states = requestedState ? [requestedState] : listStates(envDir);
  if (states.length === 0) {
    fail(`No state files found in ${envDir}.`);
  }

  // Sweep states concurrently, at most `concurrency` browsers at once. Each run
  // gets a distinct port (basePort + index) so a not-yet-released socket can't
  // collide with another run, regardless of scheduling order.
  const results: { state: string; ok: boolean }[] = new Array(states.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = next++;
      if (index >= states.length) return;
      const state = states[index];
      // Each worker drains its share sequentially; concurrency comes from the
      // pool of workers, not from overlapping a single worker's runs.
      // eslint-disable-next-line no-await-in-loop
      const ok = await runSmoke({
        env,
        state,
        port: basePort + index,
        workspaceRoot,
        sourceDir,
        printResult: states.length === 1,
        extraEnv,
      });
      results[index] = { state, ok };
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, states.length) }, worker),
  );

  if (states.length > 1) {
    const passed = results.filter((r) => r.ok).length;
    process.stderr.write(
      `\n${chalk.bold("Summary")} ${chalk.dim(`(${passed}/${results.length} passed, ${env})`)}\n`,
    );
    for (const r of results) {
      const mark = r.ok ? chalk.green("✔") : chalk.red("✘");
      process.stderr.write(`  ${mark} ${r.state}\n`);
    }
  }

  if (results.some((r) => !r.ok)) {
    process.exitCode = 1;
  }
}

void main();
