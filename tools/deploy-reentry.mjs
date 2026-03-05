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

/* eslint-disable no-await-in-loop */

import "zx/globals"; // get access to $ function

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Octokit } from "@octokit/rest";
import { WebClient as SlackClient } from "@slack/web-api";
import inquirer from "inquirer";

// The default is true, but we explicitly set it here because it needs to be set to true
// in order for the gcloud stderr to display (used for the backend deploy)
$.verbose = true;

const startTime = Date.now();

if ((await $`git status --porcelain`).stdout.trim() !== "") {
  console.error(
    "The git repo contains uncommitted changes. Make sure the repo is clean before deploying.",
  );
  process.exit(1);
}

// Update gcloud ADC and Firebase CLI credentials if not already logged in.
// We don't check the output of the command because without credentials,
// something will fail later on.
console.log("Checking gcloud ADC credentials...");
try {
  await $`gcloud auth application-default print-access-token --quiet`;
} catch {
  await $`gcloud auth login --update-adc`;
}

const secretClient = new SecretManagerServiceClient({
  projectId: "recidiviz-123",
});
const [deployScriptPat] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/github_deploy_script_pat/versions/latest",
});

const owner = "Recidiviz";
const repo = "pulse-dashboards";
const octokit = new Octokit({
  auth: deployScriptPat.payload.data.toString(),
});
const currentRevision = (await $`git rev-parse --short HEAD`).stdout.trim();
const successfullyDeployed = [];
let deployingLatestMain = true;
let isCpDeploy = false;

// Determine which environment to deploy
const { deployEnv } = await inquirer.prompt({
  type: "list",
  choices: ["staging", "demo", "dev", "pilot", "production"],
  name: "deployEnv",
  message: "Which environment are you deploying Reentry to?",
  default: "dev",
});

// Display names for the services to be deployed
const reentryBackendV0DisplayName = "Reentry Backend Services (v0)";
const reentryFrontendDisplayName = "Reentry Frontend";

const deployServicesChoices = [
  { name: reentryBackendV0DisplayName, checked: true },
  { name: reentryFrontendDisplayName, checked: true },
];

const deployServicesPrompt = await inquirer.prompt({
  type: "checkbox",
  name: "deployServices",
  message:
    "Deploying selected services. Press 'Enter' to proceed or modify your selections.",
  choices: deployServicesChoices,
});

const deployReentryBackend = deployServicesPrompt.deployServices.includes(
  reentryBackendV0DisplayName,
);
const deployReentryFrontend = deployServicesPrompt.deployServices.includes(
  reentryFrontendDisplayName,
);

if (deployEnv === "staging") {
  const mainBranch = await octokit.rest.repos.getBranch({
    owner,
    repo,
    branch: "main",
  });
  if (!mainBranch.data.commit.sha.startsWith(currentRevision)) {
    const { proceedAnyway } = await inquirer.prompt({
      type: "confirm",
      name: "proceedAnyway",
      message:
        "⚠️ The commit you're about to deploy to staging is NOT the tip of main. Would you like to proceed anyway? ⚠️",
      default: false,
    });
    if (!proceedAnyway) process.exit(1);
    deployingLatestMain = false;
  }
}

if (deployEnv === "production") {
  ({ isCpDeploy } = await inquirer.prompt({
    type: "confirm",
    name: "isCpDeploy",
    message: `Is this a cherry-pick deploy?`,
    default: false,
  }));
}

console.log("Running nx reset...");
await $`nx reset`.pipe(process.stdout);

console.log("Installing yarn packages...");
await $`yarn install`.pipe(process.stdout);

console.log("Updating atmos...");
await $`brew install atmos`.pipe(process.stdout);

if (deployReentryBackend) {
  let retryDeploy = false;

  do {
    // Deploy the app
    console.log(`Deploying ${reentryBackendV0DisplayName}...`);

    try {
      if (deployEnv === "staging") {
        await $`gcloud builds submit apps/@reentry/backend --project recidiviz-rnd-planner --config apps/@reentry/backend/deploy/staging/cloudbuild.yaml --substitutions=COMMIT_SHA=${currentRevision}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "production") {
        await $`gcloud builds submit apps/@reentry/backend --project recidiviz-rnd-planner --config apps/@reentry/backend/deploy/production/cloudbuild.yaml --substitutions=COMMIT_SHA=${currentRevision}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "demo") {
        await $`gcloud builds submit apps/@reentry/backend --project recidiviz-rnd-planner --config apps/@reentry/backend/deploy/demo/cloudbuild.yaml --substitutions=COMMIT_SHA=${currentRevision}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "dev") {
        await $`gcloud builds submit apps/@reentry/backend --project recidiviz-rnd-planner --config apps/@reentry/backend/deploy/dev/cloudbuild.yaml --substitutions=COMMIT_SHA=${currentRevision}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "pilot") {
        await $`gcloud builds submit apps/@reentry/backend --project recidiviz-rnd-planner --config apps/@reentry/backend/deploy/pilot/cloudbuild.yaml --substitutions=COMMIT_SHA=${currentRevision}`.pipe(
          process.stdout,
        );
      }

      retryDeploy = false;
      successfullyDeployed.push(reentryBackendV0DisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${reentryBackendV0DisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

if (deployReentryFrontend) {
  let retryDeploy = false;

  do {
    // Deploy the app
    console.log(`Deploying ${reentryFrontendDisplayName}...`);
    try {
      if (deployEnv === "staging") {
        await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration ${deployEnv}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "production") {
        if (isCpDeploy) {
          await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration cherry-pick`.pipe(
            process.stdout,
          );
        } else {
          await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
        }
      } else if (deployEnv === "demo") {
        await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration ${deployEnv}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "dev") {
        // have to use dev_gcp instead of dev or reentry-dev because in project.json dev is already taken for local dev
        // apps/@reentry/frontend/project.json
        await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration dev_gcp`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "pilot") {
        await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration pilot`.pipe(
          process.stdout,
        );
      }

      retryDeploy = false;
      successfullyDeployed.push(reentryFrontendDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${reentryFrontendDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

// Post a message to Slack about the deployment through the Deployment Bot account
console.log("Posting the deploy notification to Slack...");

$.verbose = false;
const deployer = (await $`gcloud config get-value account`).stdout.trim();

console.log("Reading Slack token from Secret Manager...");
const [slackToken] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/deploy_slack_bot_authorization_token/versions/latest",
});

const slack = new SlackClient(slackToken.payload.data.toString());
const reentryChannelId = "C0A432T3QUB";

let slackMessage = null;

if (successfullyDeployed.length > 0) {
  let revisionText = "`" + currentRevision + "`";
  if (!deployingLatestMain) revisionText += " (not the tip of main)";

  slackMessage = `${deployer} deployed ${revisionText} to ${deployEnv}!`;
  slackMessage += `\nWhat was deployed: ${successfullyDeployed.join(", ")}`;
}

if (slackMessage !== null) {
  try {
    const slackMessageResponse = await slack.chat.postMessage({
      channel: reentryChannelId,
      text: slackMessage,
      // Don't show previews for Github links
      unfurl_links: false,
      unfurl_media: false,
    });
    if (slackMessageResponse.ok) {
      console.log(`Successfully posted to Slack channel ${reentryChannelId}`);
    } else {
      throw slackMessageResponse;
    }
  } catch (error) {
    console.log(
      "There was a problem posting to Slack, please post the message manually:",
    );
    console.log(slackMessage);
    console.error(error);
  }
}

console.log(
  `Finished with the ${deployEnv} deploy! Commit hash: ${currentRevision}`,
);

const endTime = Date.now();
const elapsedSeconds = Math.floor((endTime - startTime) / 1000);
const minutes = Math.floor(elapsedSeconds / 60);
const seconds = elapsedSeconds % 60;
console.log(`Total execution time: ${minutes}m ${seconds}s`);
