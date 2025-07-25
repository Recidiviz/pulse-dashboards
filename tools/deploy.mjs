// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { inc } from "semver";

// The default is true, but we explicitly set it here because it needs to be set to true
// in order for the gcloud stderr to display (used for the backend deploy)
$.verbose = true;

if ((await $`git status --porcelain`).stdout.trim() !== "") {
  console.error(
    "The git repo contains uncommitted changes. Make sure the repo is clean before deploying.",
  );
  process.exit(1);
}

// Get the most recent release
console.log("Reading GitHub access token from Secret Manager...");
const secretClient = new SecretManagerServiceClient({
  projectId: "recidiviz-123",
});
const [deployScriptPat] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/github_deploy_script_pat/versions/latest",
});
const [slackToken] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/deploy_slack_bot_authorization_token/versions/latest",
});

const owner = "Recidiviz";
const repo = "pulse-dashboards";
const currentRevision = (await $`git rev-parse --short HEAD`).stdout.trim();
const octokit = new Octokit({
  auth: deployScriptPat.payload.data.toString(),
});
const slack = new SlackClient(slackToken.payload.data.toString());
let latestRelease;
let latestReleaseVersion;
let generatedReleaseNotes;
let nextVersion = "deploy-candidate";
let publishReleaseNotes;
let releaseNotes;
let isCpDeploy;
const successfullyDeployed = [];
let deployingLatestMain = true;

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
        "Enter a name for your preview app (letters, digits, and hyphens only):",
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
  await $`nx build-staging staff`.pipe(process.stdout);
  await $`firebase hosting:channel:deploy ${previewAppName} -P staging --expires ${expiration}`.pipe(
    process.stdout,
  );
  process.exit();
}

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

  console.log("Generating release notes...");
  latestRelease = await octokit.rest.repos.getLatestRelease({
    owner,
    repo,
  });
  latestReleaseVersion = latestRelease.data.tag_name;

  // Generate release notes (for review by the person doing the release)
  generatedReleaseNotes = await octokit.rest.repos.generateReleaseNotes({
    owner,
    repo,
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

    console.log(`${chalk.bold("New release notes:")}\n${releaseNotes}`);
  }

  let releaseType;
  let versionToIncrement;
  if (isCpDeploy) {
    // Get the nearest annotated tag, so that if the minor version is updated and
    // a CP is needed for a version with a lower minor, then the patch version
    // is incremented for the correct minor
    versionToIncrement = (await $`git describe --abbrev=0`).stdout.trim();
    releaseType = "patch";
  } else {
    versionToIncrement = latestReleaseVersion;
    releaseType = "minor";
  }

  // Increment the version
  nextVersion = `v${inc(versionToIncrement, releaseType)}`;

  publishReleaseNotes = false;
}

const deployServicesChoices = [
  { name: "Staff backend", checked: true },
  { name: "Staff frontend", checked: true },
  { name: "Sentencing server", checked: true },
  { name: "JII texting server", checked: true },
  { name: "Case notes server", checked: true },
  { name: "Opportunities frontend", checked: true },
  { name: "Opportunities backend", checked: true },
];

if (deployEnv === "demo") {
  deployServicesChoices.push({ name: "Demo fixtures", checked: true });
}

if (deployEnv === "production") {
  deployServicesChoices.push({
    name: "Opportunities test data",
    checked: true,
  });
}

const deployServicesPrompt = await inquirer.prompt({
  type: "checkbox",
  name: "deployServices",
  message:
    "Deploying all services by default. Press 'Enter' to proceed or deselect the services you wish to exclude.",
  choices: deployServicesChoices,
});

const deployBackend =
  deployServicesPrompt.deployServices.includes("Staff backend");
const deployFrontend =
  deployServicesPrompt.deployServices.includes("Staff frontend");
const deploySentencing =
  deployServicesPrompt.deployServices.includes("Sentencing server");
const deployJII =
  deployServicesPrompt.deployServices.includes("JII texting server");
const deployCaseNotes =
  deployServicesPrompt.deployServices.includes("Case notes server");
const deployDemoFixtures =
  deployServicesPrompt.deployServices.includes("Demo fixtures");
const deployOppsFrontend = deployServicesPrompt.deployServices.includes(
  "Opportunities frontend",
);
const deployOppsBackend = deployServicesPrompt.deployServices.includes(
  "Opportunities backend",
);
const deployOppsTestData = deployServicesPrompt.deployServices.includes(
  "Opportunities test data",
);

console.log("Running nx reset...");
await $`nx reset`.pipe(process.stdout);

console.log("Installing yarn packages...");
await $`yarn install`.pipe(process.stdout);

console.log("Updating atmos...");
await $`brew install atmos`.pipe(process.stdout);

if (deployBackend) {
  console.log("Building backend application ...");
  await $`nx build staff-shared-server`.pipe(process.stdout);

  const gaeVersion = nextVersion.replaceAll(".", "-");
  let retryBackend = false;
  do {
    try {
      switch (deployEnv) {
        case "production":
          await $`gcloud app deploy -q dist/libs/staff-shared-server/gae-production.yaml --project recidiviz-dashboard-production --version ${gaeVersion}`.pipe(
            process.stdout,
          );
          publishReleaseNotes = true;
          break;
        case "demo":
          await $`gcloud app deploy -q dist/libs/staff-shared-server/gae-staging-demo.yaml --project recidiviz-dashboard-staging`.pipe(
            process.stdout,
          );
          break;
        default:
          await $`gcloud app deploy -q dist/libs/staff-shared-server/gae-staging.yaml --project recidiviz-dashboard-staging`.pipe(
            process.stdout,
          );
          break;
      }
      retryBackend = false;
      successfullyDeployed.push("staff-shared-server");
    } catch (e) {
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

if (deployFrontend) {
  // Build the application
  console.log("Building frontend application...");
  switch (deployEnv) {
    case "production":
      await $`nx build staff`.pipe(process.stdout);
      break;
    case "demo":
      await $`nx build-demo staff`.pipe(process.stdout);
      break;
    default:
      await $`nx build-staging staff`.pipe(process.stdout);
  }

  let retryFrontend = false;
  do {
    // Deploy the app with the tag name in a comment
    console.log("Deploying application to Firebase...");
    try {
      switch (deployEnv) {
        case "production":
          await $`firebase deploy --only hosting -P production -m "Version ${nextVersion} - Commit hash ${currentRevision}"`.pipe(
            process.stdout,
          );
          publishReleaseNotes = true;
          break;
        default:
          await $`firebase deploy --only hosting -P ${deployEnv} -m "${currentRevision}"`.pipe(
            process.stdout,
          );
      }
      retryFrontend = false;
      successfullyDeployed.push("Frontend");
    } catch (e) {
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

if (
  deployEnv === "staging" ||
  deployEnv === "production" ||
  deployEnv === "demo"
) {
  if (deploySentencing) {
    console.log("Building and deploying the application...");

    // Start docker and configure docker to upload to container registry
    // Only needed for staging deploys
    if (
      deployEnv === "staging" ||
      (deployEnv === "production" && isCpDeploy) ||
      deployEnv === "demo"
    ) {
      try {
        await $`open -a Docker && gcloud auth configure-docker us-central1-docker.pkg.dev`.pipe(
          process.stdout,
        );
      } catch (e) {
        console.error("Failed to configure docker for gcloud", e);
      }
    }

    let retryDeploy = false;
    do {
      // Deploy the app
      console.log("Deploying sentencing backend services...");
      try {
        // We only need to build and push the docker containers if we are
        // 1. deploying to staging
        // 2. deploying a cherry-pick
        // 3. deploying to demo
        // If we're on production, we should use the container that (ideally) should have been pushed in an earlier staging deploy.

        if (deployEnv === "staging") {
          await $`COMMIT_SHA=${currentRevision} nx container @sentencing/server --configuration ${deployEnv}`.pipe(
            process.stdout,
          );

          await $`COMMIT_SHA=${currentRevision} nx container @sentencing/import --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "production" && isCpDeploy) {
          await $`COMMIT_SHA=${currentRevision} nx container @sentencing/server --configuration cherry-pick`.pipe(
            process.stdout,
          );

          await $`COMMIT_SHA=${currentRevision} nx container @sentencing/import --configuration cherry-pick`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "demo") {
          await $`COMMIT_SHA=${currentRevision} nx container @sentencing/server --configuration demo`.pipe(
            process.stdout,
          );

          // There is no import job for demo, instead we have a cloud run job that
          // seeds the demo database
          await $`COMMIT_SHA=${currentRevision} nx container @sentencing/seed-demo --configuration demo`.pipe(
            process.stdout,
          );
        }

        // Deploy any changes to the artifact registry if we're on staging
        if (deployEnv === "staging") {
          await $`yarn atmos:apply artifact_registry -s recidiviz-dashboard-${deployEnv}--sentencing -- -auto-approve`.pipe(
            process.stdout,
          );
        }

        // Deploy the import, migration, and server infrastructure changes for the applicable environment
        let stack;
        if (deployEnv === "staging") {
          stack = `recidiviz-dashboard-${deployEnv}--sentencing`;
        } else if (deployEnv === "production") {
          stack = `recidiviz-dashboard-${deployEnv}--sentencing`;
        } else if (deployEnv === "demo") {
          stack = "recidiviz-dashboard-staging--sentencing-demo";
        }

        await $`yarn atmos:apply apps/sentencing -s ${stack} -- -auto-approve \
          -var server_container_version=${currentRevision} \
          -var migrate_db_container_version=${currentRevision} \
          -var import_container_version=${currentRevision}`.pipe(
          process.stdout,
        );

        if (deployEnv === "demo") {
          // If we're in demo mode, deploy the seed demo job
          await $`yarn atmos:apply apps/sentencing-seed-demo -s ${stack} -- -auto-approve -var container_version=${currentRevision}`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "production") {
          await $`yarn atmos:apply postgres-bq-data-transfer -s recidiviz-dashboard-production--sentencing -- -auto-approve`.pipe(
            process.stdout,
          );
        }

        retryDeploy = false;
        successfullyDeployed.push("Sentencing Server");
      } catch (e) {
        const retryDeployPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryDeploy",
          message: `Sentencing server deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryDeploy = retryDeployPrompt.retryDeploy;
      }
    } while (retryDeploy);
  }
}

if (
  deployEnv === "staging" ||
  deployEnv === "production" ||
  deployEnv === "demo"
) {
  if (deployJII) {
    console.log("Building and deploying the application...");

    // Start docker and configure docker to upload to container registry
    // Only needed for staging deploys
    if (
      deployEnv === "staging" ||
      (deployEnv === "production" && isCpDeploy) ||
      deployEnv === "demo"
    ) {
      try {
        await $`open -a Docker && gcloud auth configure-docker us-central1-docker.pkg.dev`.pipe(
          process.stdout,
        );
      } catch (e) {
        console.error("Failed to configure docker for gcloud", e);
      }
    }

    let retryDeploy = false;
    do {
      // Deploy the app
      console.log("Deploying application to Cloud Run...");
      try {
        // We only need to build and push the docker container if we are
        // 1. deploying to staging.
        // 2. deploying a cherry-pick
        // If we're on production, we should use the container that (ideally) should have been pushed in an earlier staging deploy.
        if (deployEnv === "staging") {
          // Push the docker container for the Cloud Run service

          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/server --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
          // Push the docker container for the Cloud Run jobs
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/processor --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/import --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "production" && isCpDeploy) {
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/server --configuration cherry-pick`.pipe(
            process.stdout,
          );
          // Push the docker container for the Cloud Run jobs
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/processor --configuration cherry-pick`.pipe(
            process.stdout,
          );
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/import --configuration cherry-pick`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "demo") {
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/processor --configuration demo`.pipe(
            process.stdout,
          );
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/seed-demo --configuration demo`.pipe(
            process.stdout,
          );
          await $`COMMIT_SHA=${currentRevision} nx container @jii-texting/server --configuration demo`.pipe(
            process.stdout,
          );
        }

        // TODO(#7617) Check if ETL Cloud Run Job is running before DB migration
        await $`COMMIT_SHA=${currentRevision} nx run @jii-texting/server:deploy --configuration=${deployEnv} --tag=${currentRevision} --migrate=true`.pipe(
          process.stdout,
        );

        if (deployEnv === "demo") {
          await $`yarn atmos:apply seed-demo -s recidiviz-dashboard-staging--jii-texting-demo -- -auto-approve`.pipe(
            process.stdout,
          );
        }

        retryDeploy = false;
        successfullyDeployed.push("JII Texting Server");
      } catch (e) {
        const retryDeployPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryDeploy",
          message: `JII Texting server deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryDeploy = retryDeployPrompt.retryDeploy;
      }
    } while (retryDeploy);
  }
}

if (
  deployEnv === "staging" ||
  deployEnv === "production" ||
  deployEnv === "demo"
) {
  if (deployCaseNotes) {
    console.log("Building and deploying the application...");

    // Start docker and configure docker to upload to container registry
    // Only needed for staging deploys
    if (
      deployEnv === "staging" ||
      (deployEnv === "production" && isCpDeploy) ||
      deployEnv === "demo"
    ) {
      try {
        await $`open -a Docker && gcloud auth configure-docker us-central1-docker.pkg.dev`.pipe(
          process.stdout,
        );
      } catch (e) {
        console.error("Failed to configure docker for gcloud", e);
      }
    }

    let retryDeploy = false;
    do {
      // Deploy the app
      console.log("Deploying application to Cloud Run...");
      try {
        // We only need to build and push the docker container if we are
        // 1. deploying to staging.
        // 2. deploying a cherry-pick
        // If we're on production, we should use the container that (ideally) should have been pushed in an earlier staging deploy.
        if (deployEnv === "staging") {
          await $`COMMIT_SHA=${currentRevision} nx container case-notes-server --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "production" && isCpDeploy) {
          await $`COMMIT_SHA=${currentRevision} nx container case-notes-server --configuration cherry-pick`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "demo") {
          await $`COMMIT_SHA=${currentRevision} nx container case-notes-server --configuration demo`.pipe(
            process.stdout,
          );
        }

        await $`COMMIT_SHA=${currentRevision} nx deploy-app case-notes-server --configuration ${deployEnv}`.pipe(
          process.stdout,
        );

        retryDeploy = false;
        successfullyDeployed.push("Case Notes Server");
      } catch (e) {
        const retryDeployPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryDeploy",
          message: `Case notes server deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryDeploy = retryDeployPrompt.retryDeploy;
      }
    } while (retryDeploy);
  }
}

if (
  // there is no demo backend for Opportunities, it shares the staging backend
  deployEnv === "staging" ||
  deployEnv === "production"
) {
  if (deployOppsBackend) {
    let retryDeploy = false;

    do {
      try {
        await $`nx deploy jii-functions --configuration ${deployEnv}`.pipe(
          process.stdout,
        );

        retryDeploy = false;
        successfullyDeployed.push("Opportunities backend");
      } catch (e) {
        const retryDeployPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryDeploy",
          message: `Opportunities backend deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryDeploy = retryDeployPrompt.retryDeploy;
      }
    } while (retryDeploy);
  }
}

if (
  deployEnv === "staging" ||
  deployEnv === "production" ||
  deployEnv === "demo"
) {
  if (deployOppsFrontend) {
    // building separately because we want to pass extra args
    // to the deploy command but not the build command
    await $`nx build jii --configuration ${deployEnv}`.pipe(process.stdout);

    let retryDeploy = false;
    do {
      try {
        let deployMessage = `${currentRevision}`;
        if (deployEnv === "production") {
          deployMessage = `Version ${nextVersion} - Commit hash ${currentRevision}`;
          publishReleaseNotes = true;
        }

        // we built the project manually first,
        // skipping dependencies avoids passing arbitrary extra args to the build command
        await $`nx deploy jii --configuration ${deployEnv} --excludeTaskDependencies -m "${deployMessage}"`.pipe(
          process.stdout,
        );

        retryDeploy = false;
        successfullyDeployed.push("Opportunities frontend");
      } catch (e) {
        const retryDeployPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryDeploy",
          message: `Opportunities frontend deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryDeploy = retryDeployPrompt.retryDeploy;
      }
    } while (retryDeploy);
  }
}

if (deployOppsTestData) {
  let retryFixtures = false;
  do {
    console.log("Updating production test data fixtures ...");
    successfullyDeployed.push("Opportunities production test data");
    try {
      await $`nx load-demo-fixtures staff -c production`.pipe(process.stdout);
    } catch (e) {
      const retryFixturesPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryFixtures",
        message: `Opportunities production test data deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryFixtures = retryFixturesPrompt.retryFixtures;
    }
  } while (retryFixtures);
}

if (deployEnv === "demo") {
  if (deployDemoFixtures) {
    let retryFixtures = false;
    do {
      console.log("Updating demo fixtures ...");
      successfullyDeployed.push("Demo fixtures");
      try {
        await $`nx load-demo-fixtures staff -c staging`.pipe(process.stdout);
      } catch (e) {
        const retryFixturesPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryFixtures",
          message: `Demo fixtures deploy failed with error: ${e}. Retry?`,
          default: false,
        });
        retryFixtures = retryFixturesPrompt.retryFixtures;
      }
    } while (retryFixtures);
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
    owner,
    repo,
    tag_name: nextVersion,
    body: releaseNotes,
    make_latest: "true", // yes, this is a string
  });

  console.log(`Release published at ${release.data.html_url}`);

  // Create and publish a release branch to use to commit to for CPs
  if (!isCpDeploy) {
    // Create a branch for this release
    const versionSplit = nextVersion.substring(1).split(".");
    // Only use the major and minor in the release branch name
    const releaseBranchName = `releases/v${versionSplit[0]}.${versionSplit[1]}`;
    await $`git checkout -b ${releaseBranchName}`.pipe(process.stdout);

    // Publish the branch
    await $`git push --set-upstream origin ${releaseBranchName}`.pipe(
      process.stdout,
    );
  }
}

// Post a message to Slack about the deployment through the Deployment Bot account
console.log("Posting the deploy notification to Slack...");

$.verbose = false;
const deployer = (await $`gcloud config get-value account`).stdout.trim();

const polarisChannelId = "C026UPMAX4G";
const polarisEngChannelId = "C04LC0VH78B";

let slackChannel = null;
let slackMessage = null;

if (deployEnv === "staging" && successfullyDeployed.length > 0) {
  slackChannel = polarisEngChannelId;

  let revisionText = "`" + currentRevision + "`";
  if (!deployingLatestMain) revisionText += " (not the tip of main)";

  slackMessage = `${deployer} deployed ${revisionText} to staging!`;

  // Add a github link when a stable one exists, i.e. when the commit just deployed
  // exists on origin/main, even if it is not the tip
  const mostRecentAncestor = (
    await $`git fetch origin main --negotiate-only --negotiation-tip=${currentRevision}`
  ).stdout.trim();
  const shortenedAncestor = (
    await $`git rev-parse --short ${mostRecentAncestor}`
  ).stdout.trim();
  if (shortenedAncestor === currentRevision) {
    const githubLink = `https://github.com/${owner}/${repo}/commit/${mostRecentAncestor}`;
    slackMessage += ` (<${githubLink}|view on GitHub>)`;
  }
} else if (deployEnv === "production") {
  let message = `${deployer} deployed ${nextVersion} to production!`;

  if (publishReleaseNotes) {
    const releaseNotesMessage = releaseNotes
      .split("\n")
      .slice(1, -1)
      .join("\n")
      .trim(); // remove header and footer lines
    message += ` \`\`\`${releaseNotesMessage}\`\`\``;
  }

  slackChannel = polarisChannelId;
  slackMessage = message;
}

if (slackChannel !== null && slackMessage !== null) {
  slackMessage += `\nWhat was deployed: ${successfullyDeployed.join(", ")}`;
  try {
    const slackMessageResponse = await slack.chat.postMessage({
      channel: slackChannel,
      text: slackMessage,
      // Don't show previews for Github links
      unfurl_links: false,
      unfurl_media: false,
    });
    if (slackMessageResponse.ok) {
      console.log("Successfully posted to Slack");
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
