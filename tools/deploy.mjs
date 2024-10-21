/* eslint-disable no-console -- this is a script that prints its output */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] --
 * allow dev dependencies since this won't run in production
 * */

import "zx/globals"; // get access to $ function

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Octokit } from "@octokit/rest";
import inquirer from "inquirer";
import { inc } from "semver";
import { WebClient as SlackClient } from "@slack/web-api";

// The default is true, but we explicitly set it here because it needs to be set to true
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
const [slackToken] = await secretClient.accessSecretVersion({
  name: "projects/recidiviz-123/secrets/deploy_slack_bot_authorization_token/versions/latest",
});

console.log("Installing yarn packages...");
await $`yarn install`.pipe(process.stdout);

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
  await $`nx build-staging staff`.pipe(process.stdout);
  await $`firebase hosting:channel:deploy ${previewAppName} -P staging --expires ${expiration}`.pipe(
    process.stdout,
  );
  process.exit();
}

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
    // eslint-disable-next-line no-undef -- chalk is part of the zx global import
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

const deployBackendPrompt = await inquirer.prompt({
  type: "confirm",
  name: "deployBackend",
  message: "Would you like to deploy the backend?",
});

if (deployBackendPrompt.deployBackend) {
  // Load environment files (auth config, service accounts, GAE config)
  console.log("Loading environment files from Secret Manager...");
  await $`nx load-config-files staff`.pipe(process.stdout);

  const gaeVersion = nextVersion.replaceAll(".", "-");
  let retryBackend = false;
  do {
    try {
      switch (deployEnv) {
        case "production":
          // eslint-disable-next-line no-await-in-loop
          await $`gcloud app deploy gae-production.yaml --project recidiviz-dashboard-production --version ${gaeVersion}`.pipe(
            process.stdout,
          );
          publishReleaseNotes = true;
          break;
        case "demo":
          // eslint-disable-next-line no-await-in-loop
          await $`gcloud app deploy gae-staging-demo.yaml --project recidiviz-dashboard-staging`.pipe(
            process.stdout,
          );
          break;
        default:
          // eslint-disable-next-line no-await-in-loop
          await $`gcloud app deploy gae-staging.yaml --project recidiviz-dashboard-staging`.pipe(
            process.stdout,
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
      await $`nx build staff`.pipe(process.stdout);
      break;
    case "demo":
      await $`nx build-demo staff`.pipe(process.stdout);
      break;
    default:
      await $`nx build-staging staff`.pipe(process.stdout);
  }

  // Run a preview
  // This deploys a preview application instead of doing `firebase serve`, because `firebase serve`
  // is exited with ctrl-c, and even though hypothetically we could catch the SIGINT or do something
  // clever with `screen` and piping output, this is much easier.
  console.log("Deploying preview application...");
  await $`firebase hosting:channel:deploy ${nextVersion} -P ${deployEnv}  --expires 1h`.pipe(
    process.stdout,
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
            await $`firebase deploy --only hosting -P production -m "Version ${nextVersion} - Commit hash ${currentRevision}"`.pipe(
              process.stdout,
            );
            publishReleaseNotes = true;
            break;
          default:
            // eslint-disable-next-line no-await-in-loop
            await $`firebase deploy --only hosting -P ${deployEnv} -m "${currentRevision}"`.pipe(
              process.stdout,
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

if (deployEnv === "staging" || deployEnv === "production") {
  const deploySentencingServerPrompt = await inquirer.prompt({
    type: "confirm",
    name: "deploySentencingServer",
    message: "Would you like to deploy the Sentencing Server?",
  });

  if (deploySentencingServerPrompt.deploySentencingServer) {
    console.log("Building and deploying the application...");

    console.log("Loading env variables...");
    await $`nx load-env-files sentencing-server`.pipe(process.stdout);

    // Start docker and configure docker to upload to container registry
    // Only needed for staging deploys
    if (deployEnv === "staging") {
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
          await $`COMMIT_SHA=${currentRevision} nx container sentencing-server --configuration ${deployEnv}`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "production" && isCpDeploy) {
          await $`COMMIT_SHA=${currentRevision} nx container sentencing-server --configuration cherry-pick`.pipe(
            process.stdout,
          );
        }

        await $`COMMIT_SHA=${currentRevision} nx deploy-app sentencing-server --configuration ${deployEnv}`.pipe(
          process.stdout,
        );

        retryDeploy = false;
      } catch (e) {
        // eslint-disable-next-line no-await-in-loop
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

// Slack deployment bot

const polarisChannelId = "C026UPMAX4G";
const polarisEngChannelId = "C04LC0VH78B";

let slackChannel = null;
let slackMessage = null;

if (deployEnv === "staging") {
  slackChannel = polarisEngChannelId;
  slackMessage = `\`${currentRevision}\` on staging`;
}

if (deployEnv === "production") {
  let message = `${nextVersion} is on production!`;

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
  try {
    const slackMessageResponse = await slack.chat.postMessage({
      channel: slackChannel,
      text: slackMessage,
    });
    if (slackMessageResponse.ok) {
      console.log("Succesfully posted to Slack");
    } else {
      throw slackMessageResponse;
    }
  } catch (error) {
    console.log(
      "There was a problem posting to Slack, please post the message manually.",
    );
    console.error(error);
  }
}

console.log(
  `Finished with the ${deployEnv} deploy! Commit hash: ${currentRevision}`,
);
