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

// The default is true, but we explicitely set it here because it needs to be set to true
// in order for the gcloud stderr to display (used for the backend deploy)
$.verbose = true;

// Get the most recent release
console.log("Reading GitHub access token from Secret Manager...");
const secretClient = new SecretManagerServiceClient({
  projectId: "recidiviz-123",
});
const [deployScriptPat] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/github_deploy_script_pat/versions/latest",
});

// Load environment files (auth config, service accounts, GAE config)
console.log("Loading environment files from Secret Manager...");
await $`./load_config_files.sh`.pipe(process.stdout);

// Determine which environment to deploy
const { deployEnv } = await inquirer.prompt({
  type: "list",
  choices: ["staging", "preview", "demo", "production"],
  name: "deployEnv",
  message: "Which environment are you deploying?",
  default: "staging",
});

if (deployEnv === "preview") {
  const { previewAppName, expiration } = await inquirer.prompt([
    {
      name: "previewAppName",
      message:
        "Enter a name for your preview app (letters, digits, and hypens only):",
      validate: (name) => /^[a-zA-Z0-9-]+$/.test(name),
    },
    {
      name: "expiration",
      message: "How long should it last?",
      choices: ["7d", "1d", "1h"],
      default: "7d",
      type: "list",
    },
  ]);
  await $`yarn build-staging`.pipe(process.stdout);
  await $`firebase hosting:channel:deploy ${previewAppName} -P staging --expires ${expiration}`.pipe(
    process.stdout
  );
  process.exit();
}

let octokit;
let latestRelease;
let latestReleaseVersion;
let currentRevision;
let generatedReleaseNotes;
let nextVersion = "deploy-candidate";
let publishReleaseNotes;
let releaseNotes;

if (deployEnv === "production") {
  console.log("Generating release notes...");
  octokit = new Octokit({
    auth: deployScriptPat.payload.data.toString(),
  });

  latestRelease = await octokit.rest.repos.getLatestRelease({
    owner: "Recidiviz",
    repo: "pulse-dashboards",
  });
  latestReleaseVersion = latestRelease.data.tag_name;

  // Generate release notes (for review by the person doing the release)
  currentRevision = (await $`git rev-parse --short HEAD`).stdout.trim();
  generatedReleaseNotes = await octokit.rest.repos.generateReleaseNotes({
    owner: "Recidiviz",
    repo: "pulse-dashboards",
    tag_name: `rc/${currentRevision}`, // This tag is just a placeholder and won't actually be created
    target_commitish: currentRevision,
    previous_tag_name: latestReleaseVersion,
  });
  releaseNotes = generatedReleaseNotes.data.body;
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
  nextVersion = `v${inc(latestReleaseVersion, releaseTypePrompt.releaseType)}`;

  publishReleaseNotes = false;
}

const deployBackendPrompt = await inquirer.prompt({
  type: "confirm",
  name: "deployBackend",
  message: "Would you like to deploy the backend?",
});

if (deployBackendPrompt.deployBackend) {
  const gaeVersion = nextVersion.replaceAll(".", "-");
  let retryBackend = false;
  do {
    try {
      switch (deployEnv) {
        case "production":
          // eslint-disable-next-line no-await-in-loop
          await $`gcloud app deploy gae-production.yaml --project recidiviz-dashboard-production --version ${gaeVersion}`.pipe(
            process.stdout
          );
          publishReleaseNotes = true;
          break;
        case "demo":
          // eslint-disable-next-line no-await-in-loop
          await $`gcloud app deploy gae-staging-demo.yaml --project recidiviz-dashboard-staging`.pipe(
            process.stdout
          );
          break;
        default:
          // eslint-disable-next-line no-await-in-loop
          await $`gcloud app deploy gae-staging.yaml --project recidiviz-dashboard-staging`.pipe(
            process.stdout
          );
          break;
      }
      retryBackend = false;
    } catch (e) {
      // eslint-disable-next-line no-await-in-loop
      const retryBackendPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryBackend",
        message: `Backend deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryBackend = retryBackendPrompt.retryBackend;
    }
  } while (retryBackend);
}

const deployFrontendPrompt = await inquirer.prompt({
  type: "confirm",
  name: "deployFrontend",
  message:
    "Would you like to deploy the frontend? You will have the opportunity to preview.",
});

if (deployFrontendPrompt.deployFrontend) {
  // Build the application
  console.log("Building application...");
  switch (deployEnv) {
    case "production":
      await $`yarn build`.pipe(process.stdout);
      break;
    case "demo":
      await $`yarn build-demo`.pipe(process.stdout);
      break;
    default:
      await $`yarn build-staging`.pipe(process.stdout);
  }

  // Run a preview
  // This deploys a preview application instead of doing `firebase serve`, because `firebase serve`
  // is exited with ctrl-c, and even though hypothetically we could catch the SIGINT or do something
  // clever with `screen` and piping output, this is much easier.
  console.log("Deploying preview application...");
  await $`firebase hosting:channel:deploy ${nextVersion} -P ${deployEnv}  --expires 1h`.pipe(
    process.stdout
  );

  // Ask if the preview is good. If not, exit.
  const continuePrompt = await inquirer.prompt({
    type: "confirm",
    name: "continueRelease",
    message: `Would you like to deploy to ${deployEnv}?`,
    default: false,
  });
  if (continuePrompt.continueRelease) {
    let retryFrontend = false;
    do {
      // Deploy the app with the tag name in a comment
      console.log("Deploying application to Firebase...");
      try {
        switch (deployEnv) {
          case "production":
            // eslint-disable-next-line no-await-in-loop
            await $`firebase deploy -P production -m "${nextVersion}"`.pipe(
              process.stdout
            );
            publishReleaseNotes = true;
            break;
          default:
            // eslint-disable-next-line no-await-in-loop
            await $`firebase deploy -P ${deployEnv} -m "${currentRevision}"`.pipe(
              process.stdout
            );
        }
        retryFrontend = false;
      } catch (e) {
        // eslint-disable-next-line no-await-in-loop
        const retryFrontendPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryFrontend",
          message: `Frontend deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryFrontend = retryFrontendPrompt.retryFrontend;
      }
    } while (retryFrontend);
  }
}

// If one deploy succeeded but the other deploy failed, we still want to publish release notes for
// the one that succeeded, since any code change to fix the other will increment the release version.
if (publishReleaseNotes) {
  // Create a tag for the new version
  await $`git tag -m "Version [${nextVersion}] release - $(date +'%Y-%m-%d %H:%M:%S %Z')" "${nextVersion}"`;
  await $`git push origin ${nextVersion}`;

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
}

console.log(`Finished with the ${deployEnv} deploy!`);
