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

import { $ } from "zx";

import {
  dashboardProject,
  dashboardStack,
  dataPlatformProject,
  owner,
  repo,
} from "../config.mts";
import type { ServiceDefinition } from "../types.mts";

/**
 * Deploy the Meetings backend services (import, migration, server, artifact cleanup, seed
 * demo) via atmos. Docker images are built in GitHub Actions; the verification step ensures
 * they exist.
 */
export const meetingsBackend: ServiceDefinition = {
  displayName: "Meetings Backend Services",
  environments: ["staging", "production"],
  // Two projects: the dashboard project for the app, and the data-platform project because
  // the meetings `postgres-bq-data-transfer` stack sets `destination_project_id` there
  // (recidiviz-staging / recidiviz-123) and so creates a DTS config in it.
  pamProjects: (env) => [dashboardProject(env), dataPlatformProject(env)],
  requiredImages: () => [
    "@meetings/server",
    "@meetings/import",
    "@meetings/seed-demo",
  ],
  async deploy(plan) {
    const { env, currentRevision } = plan;

    // Deploy any changes to the artifact registry if we're on staging
    if (env === "staging") {
      await $`yarn atmos:apply artifact_registry -s recidiviz-dashboard-${env}--meetings -- -auto-approve`.pipe(
        process.stdout,
      );
    }

    // Create the release before the new containers roll out, so it exists on Sentry's
    // timeline from this deploy and not from whenever its first event happens to arrive.
    // Idempotent, so a revision staging already released reuses its release.
    await $`SENTRY_RELEASE=${currentRevision} nx sentry-release @meetings/server --configuration ${env}`.pipe(
      process.stdout,
    );

    // Deploy the import, migration, and server infrastructure changes for the applicable environment
    const stack = dashboardStack(env, "meetings");

    await $`yarn atmos:apply apps/meetings -s ${stack} -- -auto-approve \
        -var server_container_version=${currentRevision} \
        -var artifact_cleanup_container_version=${currentRevision} \
        -var migrate_db_container_version=${currentRevision} \
        -var import_container_version=${currentRevision} \
        -var seed_demo_container_version=${currentRevision}`.pipe(
      process.stdout,
    );

    // Tells Sentry this release is now running in this environment.
    await $`SENTRY_RELEASE=${currentRevision} nx sentry-deploy @meetings/server --configuration ${env}`.pipe(
      process.stdout,
    );

    // Sync the Postgres -> BQ transfer; runs after apps/meetings since it reads that component's state.
    await $`yarn atmos:apply postgres-bq-data-transfer -s ${stack} -- -auto-approve`.pipe(
      process.stdout,
    );
  },
};

/** Deploy the Meetings frontend (Expo web). */
export const meetingsFrontend: ServiceDefinition = {
  displayName: "Meetings Frontend",
  environments: ["staging", "production"],
  // Expo/Firebase deploys to the recidiviz-meetings* projects, per .firebaserc.
  pamProjects: (env) =>
    env === "production"
      ? ["recidiviz-meetings"]
      : ["recidiviz-meetings-staging"],
  async deploy(plan) {
    // Remove .env.local if it exists, as it interferes with the deploy target
    await $`rm -f apps/@meetings/app/.env.local`.pipe(process.stdout);

    // Same identifier as the server's SENTRY_RELEASE (the image tag), so one deploy
    // maps to one release name across Sentry projects.
    const sentryRelease = plan.currentRevision;

    // Create the release up front so it exists on Sentry's timeline from this deploy,
    // not from whenever its first event happens to arrive. Both calls are idempotent,
    // so promoting a revision that staging already released reuses its release.
    await $`EXPO_PUBLIC_SENTRY_RELEASE=${sentryRelease} nx sentry-release:web @meetings/app --configuration ${plan.env}`.pipe(
      process.stdout,
    );

    await $`EXPO_PUBLIC_SENTRY_RELEASE=${sentryRelease} nx deploy:web @meetings/app --configuration ${plan.env}`.pipe(
      process.stdout,
    );

    // Tells Sentry this release is now running in this environment. A release alone is
    // just a name on the project's timeline; the deploy record is what marks it as live.
    await $`EXPO_PUBLIC_SENTRY_RELEASE=${sentryRelease} nx sentry-deploy:web @meetings/app --configuration ${plan.env}`.pipe(
      process.stdout,
    );
  },
};

/** Dispatch the mobile OTA update GitHub Action at this deploy's commit. */
export const meetingsMobileOta: ServiceDefinition = {
  displayName: "Meetings Mobile (OTA)",
  environments: ["staging", "production"],
  async deploy(plan, octokit) {
    const { env, currentRevision } = plan;
    await octokit.rest.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: "meetings-mobile-ota.yml",
      ref: "main",
      inputs: { env, commit: currentRevision },
    });
  },
};
