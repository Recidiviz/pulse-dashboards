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

/**
 * Publishes an EAS OTA update to the given channel, but only after confirming that the
 * checked-out commit's fingerprint matches the latest finished build on that channel for
 * every platform. A mismatch means the native shell is out of date with respect to native
 * dependencies/config, so this JS-only update would be incompatible with what's installed —
 * the fix is a new native build, not an OTA. In that case we skip the publish rather than
 * fail the run; the caller (the mobile-ota GitHub Action) is responsible for alerting.
 *
 * EAS computes and stores a fingerprint for every build regardless of the app's
 * `runtimeVersion.policy` (see eas-cli's computeAndMaybeUploadFingerprintWithoutExpoUpdatesAsync),
 * so this guard works today even though app.config.ts is still on `policy: "appVersion"`.
 *
 * Usage:
 *   tsx scripts/mobile-ota-with-fingerprint-guard.mts <deployEnv>
 *
 * Env vars:
 *   UPDATE_MESSAGE - message passed to `eas update --message`
 *   GITHUB_OUTPUT  - (optional) GitHub Actions output file; writes `outcome` and, on a
 *                    skip, `details` describing which platform(s) mismatched and why
 */
import fs from "node:fs";

import { $, chalk } from "zx";

import { resolveEasEnvironment } from "./eas-environment.ts";

const PLATFORMS = ["ios", "android"] as const;

interface Build {
  id: string;
}

interface FingerprintCompareResult {
  fingerprint1: { hash: string };
  fingerprint2: { hash: string };
}

interface Mismatch {
  platform: string;
  reason: string;
}

/**
 * `eas ... --json` is documented to route non-JSON messages to stderr, but at least one
 * real case (the "Environment variables ... loaded from ..." notice logged when resolving
 * `--environment`) has been observed leaking onto stdout ahead of the JSON payload anyway.
 * Rather than trust that stdout is clean, scan for the first bracket that starts a fully
 * parseable JSON document.
 */
function parseEasJsonOutput<T>(stdout: string): T {
  const candidateIndices = [...stdout.matchAll(/[{[]/g)].map((m) => m.index);
  for (const index of candidateIndices) {
    try {
      return JSON.parse(stdout.slice(index));
    } catch {
      // Not the start of the real payload (e.g. a leaked log line contains a bracket) —
      // keep scanning.
    }
  }
  throw new Error(`Could not find valid JSON in eas CLI output:\n${stdout}`);
}

async function getLatestFinishedBuildAsync(
  channel: string,
  platform: string,
): Promise<Build | null> {
  const result =
    await $`eas build:list --channel ${channel} --platform ${platform} --status finished --limit 1 --non-interactive --json`.quiet();
  const builds = parseEasJsonOutput<Build[]>(result.stdout);
  return builds[0] ?? null;
}

async function checkFingerprintAsync(
  channel: string,
  platform: string,
  easEnvironment: string,
): Promise<Mismatch | null> {
  const latestBuild = await getLatestFinishedBuildAsync(channel, platform);
  if (!latestBuild) {
    return {
      platform,
      reason: `no finished build found on channel "${channel}"`,
    };
  }

  const result =
    await $`eas fingerprint:compare --build-id ${latestBuild.id} --environment ${easEnvironment} --non-interactive --json`.quiet();
  const { fingerprint1, fingerprint2 } =
    parseEasJsonOutput<FingerprintCompareResult>(result.stdout);

  if (fingerprint1.hash === fingerprint2.hash) return null;

  return {
    platform,
    reason: `fingerprint ${fingerprint2.hash} (current commit) does not match ${fingerprint1.hash} (build ${latestBuild.id})`,
  };
}

function setGithubOutput(name: string, value: string): void {
  const githubOutputPath = process.env["GITHUB_OUTPUT"];
  if (!githubOutputPath) return;
  // GitHub's documented format for multiline-safe output values.
  const delimiter = `EOF_${name}`;
  fs.appendFileSync(
    githubOutputPath,
    `${name}<<${delimiter}\n${value}\n${delimiter}\n`,
  );
}

const deployEnv = process.argv[2];
if (!deployEnv) {
  console.error("Usage: mobile-ota-with-fingerprint-guard.mts <deployEnv>");
  process.exit(1);
}

const updateMessage = process.env["UPDATE_MESSAGE"];
if (!updateMessage) {
  console.error("UPDATE_MESSAGE env var is required");
  process.exit(1);
}

const channel = deployEnv;
const easEnvironment = resolveEasEnvironment(deployEnv);

console.log(
  chalk.blue(
    `Checking fingerprint compatibility for channel "${channel}" (EAS environment "${easEnvironment}")...`,
  ),
);

const mismatches: Mismatch[] = [];
for (const platform of PLATFORMS) {
  // eslint-disable-next-line no-await-in-loop
  const mismatch = await checkFingerprintAsync(
    channel,
    platform,
    easEnvironment,
  );
  if (mismatch) mismatches.push(mismatch);
}

if (mismatches.length > 0) {
  const details = mismatches
    .map((m) => `• ${m.platform}: ${m.reason}`)
    .join("\n");
  console.log(
    chalk.yellow(
      `Skipping OTA publish — fingerprint mismatch on channel "${channel}":\n${details}`,
    ),
  );
  setGithubOutput("outcome", "skipped_fingerprint_mismatch");
  setGithubOutput("details", details);
  process.exit(0);
}

console.log(
  chalk.green(
    `Fingerprints match on channel "${channel}" for all platforms, publishing OTA update...`,
  ),
);
await $`eas update --non-interactive --channel ${channel} --environment ${easEnvironment} --message ${updateMessage}`;

setGithubOutput("outcome", "published");
