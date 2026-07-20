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
 * Deploy the built staff frontend to the GCS/Cloud CDN stack
 * (libs/atmos/components/terraform/apps/staff-frontend) and invalidate the
 * CDN cache.
 *
 * Usage:
 *   tsx tools/deploy-staff-frontend.mts <staging|production> [dist-dir]
 *   nx deploy-cdn staff -- staging
 *
 * Expects a build in dist/apps/staff (nx build staff --configuration=<env>)
 * unless a dist path is passed. Requires gcloud auth with objectAdmin on the
 * frontend buckets and compute.urlMaps.invalidateCache on the project.
 *
 * Upload order is load-bearing:
 *   1. /assets (content-hashed, immutable) — must exist before any HTML that
 *      references them is live.
 *   2. Other root files.
 *   3. index.html last, to both the private origin bucket and the public
 *      "-index" bucket (the SPA deep-link fallback's error_service).
 * Deploys intentionally never delete: stale files age out via the bucket
 * lifecycle rule (see asset_retention_days), so users holding an old
 * index.html keep working assets.
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { workspaceRoot } from "@nx/devkit";
import type { LogEntry } from "zx";
import { $, chalk } from "zx";

const PROJECTS = {
  staging: "recidiviz-dashboard-staging",
  production: "recidiviz-dashboard-production",
} as const;

type DeployEnvironment = keyof typeof PROJECTS;

function isDeployEnvironment(value: string): value is DeployEnvironment {
  return value in PROJECTS;
}

function fail(message: string): never {
  console.error(chalk.red.bold("error: ") + chalk.red(message));
  process.exit(1);
}

const [environmentArg, distArg] = process.argv.slice(2);

if (!environmentArg) {
  fail(`usage: deploy-staff-frontend.mts <staging|production> [dist-dir]`);
}
if (!isDeployEnvironment(environmentArg)) {
  fail(
    `environment must be ${chalk.bold("staging")} or ${chalk.bold("production")}, got '${environmentArg}'`,
  );
}
const environment: DeployEnvironment = environmentArg;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(distArg ?? join(repoRoot, "dist/apps/staff"));

const project = PROJECTS[environment];
const bucket = `gs://${project}-staff-frontend`;
const indexBucket = `${bucket}-index`;
const urlMap = `staff-frontend-${environment}`;

if (!existsSync(join(dist, "index.html"))) {
  fail(
    `no build found at ${dist} (missing index.html).\n` +
      `Run: ${chalk.bold(`nx build staff --configuration=${environment}`)}`,
  );
}

$.log = (entry: LogEntry) => {
  // only output commands and stderr
  if (entry.kind === "cmd") {
    const [command, ...args] = entry.cmd.split(" ");
    console.log(`$ ${chalk.green(command)} ${args.join(" ")}`);
  } else if (entry.kind === "stderr") {
    let text = entry.data.toString().trim();
    if (text.startsWith("Copying file:///")) {
      text = text.replaceAll(`file://${workspaceRoot}/`, "");
    }
    if (text) {
      console.log(text);
    }
  }
};

function step(n: number, message: string): void {
  console.log(chalk.cyan.bold(`>> ${n}/4 `) + chalk.cyan(message));
}

console.log(
  chalk.bold(`Deploying ${dist} to ${bucket} `) +
    (environment === "production"
      ? chalk.bgRed.white.bold(" PRODUCTION ")
      : chalk.bgYellow.black(" staging ")),
);

try {
  step(1, "Uploading content-hashed assets");
  await $`gcloud storage cp --recursive ${join(dist, "assets")} ${bucket}/ --project ${project}`.pipe(
    process.stdout,
  );

  step(2, "Uploading remaining files (except index.html)");
  const remaining = readdirSync(dist)
    .filter((entry) => entry !== "assets" && entry !== "index.html")
    .map((entry) => join(dist, entry));
  await $`gcloud storage cp --recursive ${remaining} ${bucket}/ --project ${project}`.pipe(
    process.stdout,
  );

  step(3, "Uploading index.html (origin bucket, then public fallback bucket)");
  await $`gcloud storage cp ${join(dist, "index.html")} ${bucket}/index.html --project ${project}`.pipe(
    process.stdout,
  );
  await $`gcloud storage cp ${join(dist, "index.html")} ${indexBucket}/index.html --project ${project}`.pipe(
    process.stdout,
  );

  step(4, `Invalidating CDN cache (${urlMap})`);
  await $`gcloud compute url-maps invalidate-cdn-cache ${urlMap} --project ${project} --path ${"/*"}`.pipe(
    process.stdout,
  );
} catch (error) {
  fail(`deploy failed:\n${String(error)}`);
}

console.log(
  chalk.green.bold(">> Done. ") +
    chalk.green.underline(`https://dashboard-cdn-${environment}.recidiviz.org`),
);
