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

import type { Octokit } from "@octokit/rest";
import inquirer from "inquirer";
import { inc } from "semver";
import { $, chalk } from "zx";

import { owner, repo } from "./config.mts";
import type { DeployEnv, PublishedRelease, ReleasePlan } from "./types.mts";

type ReleaseType = "patch" | "minor";

export type NextVersionResult =
  | { ok: true; version: string }
  | { ok: false; versionToIncrement: string; releaseType: ReleaseType };

/**
 * Compute the next production version. Cherry-pick deploys bump the **patch** of the
 * nearest matching release tag (`describeTag`); other deploys bump the **minor** of the
 * latest published release. Pure so it can be unit-tested independently of git/Octokit.
 */
export function computeNextVersion(
  isCpDeploy: boolean,
  latestReleaseVersion: string,
  describeTag: string,
): NextVersionResult {
  const versionToIncrement = isCpDeploy ? describeTag : latestReleaseVersion;
  const releaseType: ReleaseType = isCpDeploy ? "patch" : "minor";
  const bumpedVersion = inc(versionToIncrement, releaseType);
  if (!bumpedVersion) {
    return { ok: false, versionToIncrement, releaseType };
  }
  return { ok: true, version: `v${bumpedVersion}` };
}

/** Glob passed to `git tag`/`git describe` to match production release tags (`vX.Y.Z`). */
const releaseTagPattern = "v[0-9]*.[0-9]*.[0-9]*";

async function prepareStagingPlan(
  octokit: Octokit,
  currentRevision: string,
): Promise<Extract<ReleasePlan, { env: "staging" }>> {
  const mainBranch = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: "main",
  });
  let deployingLatestMain = true;
  if (!mainBranch.data.commit.sha.startsWith(currentRevision)) {
    const { proceedAnyway } = (await inquirer.prompt({
      type: "confirm",
      name: "proceedAnyway",
      message:
        "⚠️ The commit you're about to deploy to staging is NOT the tip of main. Would you like to proceed anyway? ⚠️",
      default: false,
    })) as { proceedAnyway: boolean };
    if (!proceedAnyway) process.exit(1);
    deployingLatestMain = false;
  }
  return {
    env: "staging",
    currentRevision,
    nextVersion: "deploy-candidate",
    deployingLatestMain,
  };
}

async function prepareProductionPlan(
  octokit: Octokit,
  currentRevision: string,
): Promise<Extract<ReleasePlan, { env: "production" }>> {
  // If the commit being deployed is already released (a tag points at it), this is a
  // re-deploy — e.g. shipping services that were skipped on the first pass. Deploy against
  // the existing version instead of minting a new one, so we don't double-tag the commit or
  // cut a second release branch from it (the bug that produced two release lines at one SHA).
  const tagsAtHead = (
    await $`git tag --points-at HEAD --list ${releaseTagPattern}`.quiet()
  ).stdout
    .trim()
    .split("\n")
    .filter(Boolean);
  const existingTag = tagsAtHead[0];
  if (existingTag) {
    const { redeploy } = (await inquirer.prompt({
      type: "confirm",
      name: "redeploy",
      message: `This commit is already released as ${existingTag}. Re-deploy that release?`,
      default: true,
    })) as { redeploy: boolean };
    if (redeploy) {
      return {
        env: "production",
        isRedeploy: true,
        currentRevision,
        nextVersion: existingTag,
      };
    }
  }

  const { isCpDeploy } = (await inquirer.prompt({
    type: "confirm",
    name: "isCpDeploy",
    message: `Is this a cherry-pick deploy?`,
    default: false,
  })) as { isCpDeploy: boolean };

  console.log("Generating release notes...");
  const latestRelease = await octokit.rest.repos.getLatestRelease({
    owner,
    repo,
  });
  const latestReleaseVersion = latestRelease.data.tag_name;

  // Generate release notes (for review by the person doing the release)
  const generatedReleaseNotes = await octokit.rest.repos.generateReleaseNotes({
    owner,
    repo,
    tag_name: `rc/${currentRevision}`, // This tag is just a placeholder and won't actually be created
    target_commitish: currentRevision,
    previous_tag_name: latestReleaseVersion,
  });
  let releaseNotes = generatedReleaseNotes.data.body;
  console.log(releaseNotes);

  const { editNotes } = (await inquirer.prompt({
    type: "confirm",
    name: "editNotes",
    message:
      "Would you like to edit these notes? (The '**Full Changelog**' end tag will be overwritten when publishing)",
    default: false,
  })) as { editNotes: boolean };

  if (editNotes) {
    const { noteEditor } = (await inquirer.prompt({
      type: "editor",
      name: "noteEditor",
      message: "Open in editor",
      default: releaseNotes,
    })) as { noteEditor: string };
    releaseNotes = noteEditor;

    console.log(`${chalk.bold("New release notes:")}\n${releaseNotes}`);
  }

  // Get the nearest annotated tag matching the release version pattern, so that if the
  // minor version is updated and a CP is needed for a version with a lower minor, then the
  // patch version is incremented for the correct minor. The --match filter skips unrelated
  // annotated tags (e.g. reentry/v*) that would otherwise produce invalid semver input to
  // inc(). Only needed for cherry-pick deploys.
  let describeTag = "";
  if (isCpDeploy) {
    describeTag = (
      await $`git describe --abbrev=0 --match ${releaseTagPattern}`
    ).stdout.trim();
  }

  const result = computeNextVersion(
    isCpDeploy,
    latestReleaseVersion,
    describeTag,
  );
  if (!result.ok) {
    console.error(
      `Could not increment ${result.versionToIncrement} as a ${result.releaseType} release. Aborting deploy.`,
    );
    process.exit(1);
  }

  return {
    env: "production",
    isRedeploy: false,
    currentRevision,
    isCpDeploy,
    nextVersion: result.version,
    releaseNotes,
    latestReleaseVersion,
  };
}

/**
 * Build the read-only {@link ReleasePlan} for this deploy before anything ships:
 * - staging: confirm we're on the tip of main (or that the deployer wants to proceed);
 * - production: ask whether this is a cherry-pick, generate/edit release notes, and
 *   compute the next version;
 * - demo: nothing to decide.
 */
export async function preparePlan(
  octokit: Octokit,
  deployEnv: DeployEnv,
): Promise<ReleasePlan> {
  const currentRevision = (
    await $`git rev-parse --short=12 HEAD`
  ).stdout.trim();

  switch (deployEnv) {
    case "demo":
      return { env: "demo", currentRevision, nextVersion: "deploy-candidate" };

    case "staging":
      return prepareStagingPlan(octokit, currentRevision);

    case "production":
      return prepareProductionPlan(octokit, currentRevision);

    case "preview (staff frontend only)":
    default:
      throw new Error("preparePlan should not run for preview deploys");
  }
}

/**
 * After a production deploy: tag the commit, push the tag, publish the GitHub release, and
 * (for non-cherry-pick deploys) create + push the `releases/vX.Y` branch used for CPs.
 * Returns the published-release details for the Slack notification, or `null` if nothing
 * deployed successfully (in which case we publish nothing).
 */
export async function finalizeProduction(
  octokit: Octokit,
  plan: Extract<ReleasePlan, { env: "production" }>,
): Promise<PublishedRelease | null> {
  // Re-deploys ship against an existing release, so there is nothing to tag or publish.
  if (plan.isRedeploy) return null;

  // Create a tag for the new version
  await $`git tag -m "Version [${plan.nextVersion}] release - $(date +'%Y-%m-%d %H:%M:%S %Z')" "${plan.nextVersion}"`;
  await $`git push origin ${plan.nextVersion}`;

  // Update release notes to include correct end tag
  const releaseNotes = plan.releaseNotes.replace(
    `rc/${plan.currentRevision}`,
    plan.nextVersion,
  );

  // Publish release notes
  console.log("Publishing release notes...");
  const release = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: plan.nextVersion,
    body: releaseNotes,
    make_latest: "true", // yes, this is a string
  });

  console.log(`Release published at ${release.data.html_url}`);

  // Create and publish a release branch to use to commit to for CPs
  if (!plan.isCpDeploy) {
    // Create a branch for this release
    const versionSplit = plan.nextVersion.substring(1).split(".");
    // Only use the major and minor in the release branch name
    const releaseBranchName = `releases/v${versionSplit[0]}.${versionSplit[1]}`;
    await $`git checkout -b ${releaseBranchName}`.pipe(process.stdout);

    // Publish the branch
    await $`git push --set-upstream origin ${releaseBranchName}`.pipe(
      process.stdout,
    );
  }

  return {
    nextVersion: plan.nextVersion,
    releaseUrl: release.data.html_url,
    releaseNotes,
  };
}
