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
 * Deletes the sentencing and meetings preview servers (their Cloud SQL
 * instances, Cloud Run services, and Cloud Run jobs in
 * recidiviz-dashboard-staging) that belong to closed PRs, to open PRs without
 * the app's preview:<app> label, or to open PRs with no activity for STALE_DAYS
 * days. .github/workflows/preview-server-teardown.yml already deletes preview
 * servers when a PR closes or loses its label, so the sweep catches what that
 * misses.
 *
 * The sweep leaves the frontend previews alone. On PR close,
 * .github/workflows/firebase-channel-deletion.yml deletes the Firebase Hosting
 * channels and the meetings EAS channel and branch.
 *
 * Usage:
 *   yarn tsx tools/sweep-preview-servers.mts
 *
 * Each preview resource is named <prefix>-pr<PR number>-<branch fragment>. For
 * example, given these resources:
 *
 *   s-db-preview-pr15774-jdoe-add-export    (PR 15774 merged yesterday)
 *   ss-preview-pr15774-jdoe-add-export
 *   m-db-preview-pr15801-asmith-fix-login   (PR 15801 open, updated today)
 *   m-db-preview-pr15120-bsmith-new-table   (PR 15120 open, last updated 55 days ago)
 *
 * ...the sweep runs cleanup_sentencing_preview_resources.sh once with
 * VERSION=pr15774-jdoe-add-export, which deletes both PR 15774 resources, runs
 * cleanup_meetings_preview_resources.sh for PR 15120, and leaves PR 15801's
 * instance alone. The next push to PR 15120 recreates its preview, because the
 * deploy workflow clones the database again when it is missing.
 *
 * Set DRY_RUN=1 to list what would be deleted without deleting anything.
 */

import { fileURLToPath } from "node:url";

import { $, within } from "zx";

const PROJECT = "recidiviz-dashboard-staging";
const REGION = "us-central1";
const REPO = "Recidiviz/pulse-dashboards";
const DAY_SECONDS = 86400;

const dryRun = Boolean(process.env["DRY_RUN"]);
// A preview run that was still building when its PR closed keeps creating
// resources for up to about 30 minutes, so the sweep leaves a PR's resources
// alone until it has been closed this long.
const graceSeconds = Number(process.env["GRACE_SECONDS"] || 3600);
// Any PR activity (a push, a comment, a review, a label) counts as an update.
const staleSeconds = Number(process.env["STALE_DAYS"] || 14) * DAY_SECONDS;

// The name prefixes that each app's cleanup script deletes. The first capture
// group is the VERSION that script expects, and the second is the PR number.
const APP_PATTERNS = {
  sentencing:
    /^(?:s-db-preview|ss-preview|ss-migrate-preview-db|s-data-import-preview)-(pr(\d+)-.+)$/,
  meetings: /^(?:m-db-preview|m-preview|m-migrate-preview-db)-(pr(\d+)-.+)$/,
};

type App = keyof typeof APP_PATTERNS;

type Preview = { app: App; version: string; pr: string };

type PullRequest = {
  state: "OPEN" | "CLOSED" | "MERGED";
  closedAt: string | null;
  updatedAt: string;
  labels: { name: string }[];
};

$.verbose = false;

const listings = await Promise.all([
  $`gcloud sql instances list --project ${PROJECT} --format=${"value(name)"}`,
  $`gcloud run services list --project ${PROJECT} --region ${REGION} --format=${"value(metadata.name)"}`,
  $`gcloud run jobs list --project ${PROJECT} --region ${REGION} --format=${"value(metadata.name)"}`,
]);
const names = listings.flatMap((output) => output.stdout.split("\n"));

// One entry per preview, however many resources it has.
const previewsByKey = new Map<string, Preview>();
for (const name of names) {
  for (const [app, pattern] of Object.entries(APP_PATTERNS) as [
    App,
    RegExp,
  ][]) {
    const [, version, pr] = pattern.exec(name) ?? [];
    if (version && pr) {
      previewsByKey.set(`${app} ${version}`, { app, version, pr });
    }
  }
}
const previews = [...previewsByKey.entries()]
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([, preview]) => preview);

const prNumbers = [...new Set(previews.map(({ pr }) => pr))];
const lookups = new Map(
  await Promise.all(
    prNumbers.map(
      async (pr) =>
        [
          pr,
          await $`gh pr view ${pr} --repo ${REPO} --json state,closedAt,updatedAt,labels`.nothrow(),
        ] as const,
    ),
  ),
);

function secondsSince(timestamp: string): number {
  return Math.floor((Date.now() - Date.parse(timestamp)) / 1000);
}

// Returns why the preview should be deleted, or undefined to keep it.
function deletionReason(
  { app, version, pr }: Preview,
  { state, closedAt, updatedAt, labels }: PullRequest,
): string | undefined {
  if (state === "OPEN") {
    const idleSeconds = secondsSince(updatedAt);
    // Adding or removing a label counts as an update, so the grace period
    // leaves a PR whose label just came off to the teardown workflow.
    if (
      !labels.some(({ name }) => name === `preview:${app}`) &&
      idleSeconds >= graceSeconds
    ) {
      return `PR #${pr} is open without the preview:${app} label`;
    }
    if (idleSeconds >= staleSeconds) {
      return `PR #${pr} is open but idle for ${Math.floor(idleSeconds / DAY_SECONDS)} days`;
    }
    return undefined;
  }
  const closedSeconds = secondsSince(closedAt ?? updatedAt);
  if (closedSeconds < graceSeconds) {
    console.log(
      `Skipping ${app} preview ${version}: PR #${pr} closed ${closedSeconds}s ago`,
    );
    return undefined;
  }
  return `PR #${pr} is ${state}`;
}

let failures = 0;
for (const preview of previews) {
  const { app, version, pr } = preview;
  const lookup = lookups.get(pr);
  if (lookup?.exitCode !== 0) {
    process.stderr.write(lookup?.stderr ?? "");
    console.log(
      `::error::Couldn't look up PR #${pr} for ${app} preview ${version}`,
    );
    failures++;
    continue;
  }
  const reason = deletionReason(
    preview,
    JSON.parse(lookup.stdout) as PullRequest,
  );
  if (!reason) {
    continue;
  }
  console.log(`Deleting ${app} preview ${version} (${reason})`);
  if (dryRun) {
    continue;
  }

  const cleanupScript = fileURLToPath(
    new URL(`./cleanup_${app}_preview_resources.sh`, import.meta.url),
  );
  // One at a time, so each preview's gcloud output stays together in the log.
  // eslint-disable-next-line no-await-in-loop
  const cleanup = await within(() => {
    $.env = { ...process.env, VERSION: version };
    return $`${cleanupScript}`.stdio("ignore", "inherit", "inherit").nothrow();
  });
  if (cleanup.exitCode !== 0) {
    console.log(`::error::Failed to delete ${app} preview ${version}`);
    failures++;
  }
}

if (failures > 0) {
  console.log(`${failures} preview(s) failed; the next sweep will retry them`);
  process.exit(1);
}
