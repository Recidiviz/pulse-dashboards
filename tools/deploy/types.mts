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

export type DeployEnv =
  | "staging"
  | "preview (staff frontend only)"
  | "demo"
  | "production";

/**
 * A single deployable service, described declaratively. The deploy script derives the
 * selection prompt, Docker-image verification, env gating, and the build/deploy phases from
 * these objects — adding a service is just defining one of these and adding it as a key in the
 * `services` registry (see `services/index.mts`).
 *
 * Everything a phase needs about the deploy (env, revision, version) rides on the
 * {@link ReleasePlan}; services never touch Octokit/Slack.
 */
export interface ServiceDefinition {
  /** Shown in the selection prompt and sent to slack on success. */
  displayName: string;
  /** Envs where this service can deploy AND is offered in the prompt. */
  environments: DeployEnv[];
  /** Envs where the prompt pre-checks it. Defaults to {@link environments} when omitted. */
  defaultChecked?: DeployEnv[];
  /** Backend Docker images that must exist before deploying (built in GitHub Actions). */
  requiredImages?: (env: DeployEnv) => string[];
  /** One-time build phase, run OUTSIDE the retry loop. Omit when there's nothing to build. */
  build?: (plan: ReleasePlan) => Promise<void>;
  /** Deploy commands, run INSIDE the retry loop. */
  deploy: (plan: ReleasePlan) => Promise<void>;
}

/** The keys (from the `services` registry) of the services the user selected to deploy. */
export type SelectedServices = Set<string>;

/**
 * Read-only release/version decision, computed ONCE by {@link preparePlan} before any
 * deploy runs. Every deployable variant carries `currentRevision` (the commit being shipped);
 * the rest are the fields that env actually uses, so illegal states (e.g. reading `isCpDeploy`
 * on a staging deploy) are unrepresentable.
 *
 * This is the seam the upcoming RC reintroduction extends — e.g. a staging RC variant and
 * an RC-promotion path on the production variant.
 */
export type ReleasePlan =
  | {
      env: "demo";
      currentRevision: string; // git rev-parse --short=12 HEAD
      nextVersion: "deploy-candidate";
    }
  | {
      env: "staging";
      currentRevision: string;
      nextVersion: "deploy-candidate"; // staging never computes a real version
      deployingLatestMain: boolean; // was the deployed commit the tip of main?
    }
  | {
      // Re-deploy of a commit that is ALREADY released (e.g. deploying services that were
      // skipped on the first pass). No version is computed and nothing is tagged/published —
      // the deploy runs against the existing release version.
      env: "production";
      isRedeploy: true;
      currentRevision: string;
      nextVersion: string; // the existing release tag on this commit (drives service version labels)
    }
  | {
      env: "production";
      isRedeploy: false;
      currentRevision: string;
      isCpDeploy: boolean; // drives version math AND whether a release branch is cut
      nextVersion: string; // cherry-pick ⇒ patch bump; else ⇒ minor bump
      releaseNotes: string; // generated/edited in prep (still holds the rc/<rev> placeholder)
      latestReleaseVersion: string;
    };

/** Result of publishing a production release, handed to the Slack phase. */
export interface PublishedRelease {
  nextVersion: string;
  releaseUrl: string;
  releaseNotes: string; // final notes (rc/<rev> already replaced with nextVersion)
}
