// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

/* eslint-disable no-console -- this is a script that prints its output */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] --
 * allow dev dependencies since this won't run in production
 * */

import "zx/globals"; // get access to $ function

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Octokit } from "@octokit/rest";
import inquirer from "inquirer";
import { inc } from "semver";

$.verbose = false; // don't print out every command we're running

// Get the most recent release
console.log("Reading GitHub access token from Secret Manager...");
const secretClient = new SecretManagerServiceClient({
  projectId: "recidiviz-123",
});
const [deployScriptPat] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/github_deploy_script_pat/versions/latest",
});

console.log("Generating release notes...");
const octokit = new Octokit({
  auth: deployScriptPat.payload.data.toString(),
});

const latestRelease = await octokit.rest.repos.getLatestRelease({
  owner: "Recidiviz",
  repo: "pulse-dashboards",
});
const latestReleaseVersion = latestRelease.data.tag_name;

// Generate release notes (for review by the person doing the release)
const currentRevision = (await $`git rev-parse --short HEAD`).stdout.trim();
const generatedReleaseNotes = await octokit.rest.repos.generateReleaseNotes({
  owner: "Recidiviz",
  repo: "pulse-dashboards",
  tag_name: `rc/${currentRevision}`, // This tag is just a placeholder and won't actually be created
  target_commitish: currentRevision,
  previous_tag_name: latestReleaseVersion,
});
let releaseNotes = generatedReleaseNotes.data.body;
console.log(releaseNotes);

const editNotesPrompt = await inquirer.prompt({
  type: "confirm",
  name: "editNotes",
  message:
    "Would you like to edit these notes? (The '**Full Changelog**' end tag will be overwritten when publishing)",
  default: false,
});

if (editNotesPrompt.editNotes) {
  const noteEditorPrompt = await inquirer.prompt({
    type: "editor",
    name: "noteEditor",
    message: "Open in editor",
    default: releaseNotes,
  });
  releaseNotes = noteEditorPrompt.noteEditor;
  // eslint-disable-next-line no-undef -- chalk is part of the zx global import
  console.log(`${chalk.bold("New release notes:")}\n${releaseNotes}`);
}

// Determine what to increase the version by
const releaseTypePrompt = await inquirer.prompt({
  type: "list",
  name: "releaseType",
  message: "What type of release is this?",
  choices: ["major", "minor", "patch"],
  default: "minor",
});

// Increment the version
const nextVersion = `v${inc(
  latestReleaseVersion,
  releaseTypePrompt.releaseType
)}`;

// Build the application
console.log("Building application...");
await $`yarn build`.pipe(process.stdout);

// Run a preview
// This deploys a preview application instead of doing `firebase serve`, because `firebase serve`
// is exited with ctrl-c, and even though hypothetically we could catch the SIGINT or do something
// clever with `screen` and piping output, this is much easier.
console.log("Deploying preview application...");
await $`firebase hosting:channel:deploy ${nextVersion} -P production  --expires 1h`.pipe(
  process.stdout
);

// Ask if the preview is good. If not, exit.
const continuePrompt = await inquirer.prompt({
  type: "confirm",
  name: "continueRelease",
  message: `Would you like to deploy version ${nextVersion} to production?`,
  default: false,
});
if (!continuePrompt.continueRelease) {
  process.exit();
}

// Create a tag for the new version
await $`git tag -m "Version [${nextVersion}] release - $(date +'%Y-%m-%d %H:%M:%S %Z')" "${nextVersion}"`;
await $`git push origin ${nextVersion}`;

// Deploy the app with the tag name in a comment
console.log("Deploying production application...");
await $`firebase deploy -P production -m "${nextVersion}"`.pipe(process.stdout);

// Update release notes to include correct end tag
releaseNotes = releaseNotes.replace(`rc/${currentRevision}`, nextVersion);

// Publish release notes
console.log("Publishing release notes...");
const release = await octokit.rest.repos.createRelease({
  owner: "Recidiviz",
  repo: "pulse-dashboards",
  tag_name: nextVersion,
  body: releaseNotes,
  make_latest: "true", // yes, this is a string
});

console.log(`Release published at ${release.data.html_url}`);
