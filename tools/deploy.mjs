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

// Update gcloud ADC and Firebase CLI credentials if not already logged in.
// We don't check the output of the command because without credentials,
// something will fail later on.
console.log("Checking gcloud ADC and Firebase CLI credentials...");
try {
  await $`gcloud auth application-default print-access-token --quiet`;
} catch {
  await $`gcloud auth login --update-adc`;
}

try {
  await $`firebase projects:list > /dev/null`;
} catch {
  await $`firebase login --reauth`;
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
  choices: ["staging", "preview", "demo", "reentry-dev", "production"],
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

const staffBackendDisplayName = "Staff Backend";
const staffFrontendDisplayName = "Staff Frontend";
const sentencingAssistantDisplayName = "Sentencing Assistant Backend Services";
const jiiTextingDisplayName = "JII Texting Backend Services";
const caseNotesDisplayName = "Case Notes Server";
const opportunitiesFrontendDisplayName = "Opportunities Frontend";
const opportunitiesBackendDisplayName = "Opportunities Backend";
const reentryBackendV0DisplayName = "Reentry Backend Services (v0)";
const reentryBackendV1DisplayName = "Reentry Backend Services (v1)";
const reentryFrontendDisplayName = "Reentry Frontend";
const meetingAssistantDisplayName = "Meeting Assistant Backend Services";
const demoFixturesDisplayName = "Demo fixtures";
const opportunitiesTestDataDisplayName = "Opportunities test data";

const inStagingOrProd = ["staging", "production"].includes(deployEnv);
const deployServicesChoices = [
  { name: staffBackendDisplayName, checked: true },
  { name: staffFrontendDisplayName, checked: true },
  { name: sentencingAssistantDisplayName, checked: inStagingOrProd },
  { name: jiiTextingDisplayName, checked: inStagingOrProd },
  { name: caseNotesDisplayName, checked: true },
  { name: opportunitiesFrontendDisplayName, checked: true },
  { name: opportunitiesBackendDisplayName, checked: inStagingOrProd },
  { name: reentryBackendV0DisplayName, checked: false },
  { name: reentryBackendV1DisplayName, checked: false },
  { name: reentryFrontendDisplayName, checked: false },
  { name: meetingAssistantDisplayName, checked: inStagingOrProd },
];

if (deployEnv === "demo") {
  deployServicesChoices.push({ name: demoFixturesDisplayName, checked: true });
}

if (deployEnv === "production") {
  deployServicesChoices.push({
    name: opportunitiesTestDataDisplayName,
    checked: true,
  });
}

const deployServicesPrompt = await inquirer.prompt({
  type: "checkbox",
  name: "deployServices",
  message:
    "Deploying selected services. Press 'Enter' to proceed or modify your selections.",
  choices: deployServicesChoices,
});

const deployBackend = deployServicesPrompt.deployServices.includes(
  staffBackendDisplayName,
);
const deployFrontend = deployServicesPrompt.deployServices.includes(
  staffFrontendDisplayName,
);
const deploySentencing = deployServicesPrompt.deployServices.includes(
  sentencingAssistantDisplayName,
);
const deployJiiTexting = deployServicesPrompt.deployServices.includes(
  jiiTextingDisplayName,
);
const deployCaseNotes =
  deployServicesPrompt.deployServices.includes(caseNotesDisplayName);
const deployDemoFixtures = deployServicesPrompt.deployServices.includes(
  demoFixturesDisplayName,
);
const deployOppsFrontend = deployServicesPrompt.deployServices.includes(
  opportunitiesFrontendDisplayName,
);
const deployOppsBackend = deployServicesPrompt.deployServices.includes(
  opportunitiesBackendDisplayName,
);
const deployOppsTestData = deployServicesPrompt.deployServices.includes(
  opportunitiesTestDataDisplayName,
);
const deployReentryBackend = deployServicesPrompt.deployServices.includes(
  reentryBackendV0DisplayName,
);
const deployReentryServer = deployServicesPrompt.deployServices.includes(
  reentryBackendV1DisplayName,
);
const deployReentryFrontend = deployServicesPrompt.deployServices.includes(
  reentryFrontendDisplayName,
);
const deployMeetingAssistant = deployServicesPrompt.deployServices.includes(
  meetingAssistantDisplayName,
);

console.log("Running nx reset...");
await $`nx reset`.pipe(process.stdout);

console.log("Installing yarn packages...");
await $`yarn install`.pipe(process.stdout);

console.log("Updating atmos...");
await $`brew install atmos`.pipe(process.stdout);

// Start docker and configure docker to upload to container registry
// Only needed for staging deploys
if (
  (deployEnv === "staging" ||
    (deployEnv === "production" && isCpDeploy) ||
    deployEnv === "demo" ||
    deployEnv === "reentry-dev") &&
  (deploySentencing ||
    deployJiiTexting ||
    deployCaseNotes ||
    deployReentryServer ||
    deployMeetingAssistant)
) {
  try {
    await $`open -a Docker && gcloud auth configure-docker us-central1-docker.pkg.dev`.pipe(
      process.stdout,
    );
  } catch (e) {
    console.error("Failed to configure docker for gcloud", e);
  }
}

if (deployBackend) {
  console.log(`Building ${staffBackendDisplayName}...`);
  await $`nx build staff-shared-server`.pipe(process.stdout);

  const gaeVersion = nextVersion.replaceAll(".", "-");
  let retryBackend = false;
  do {
    try {
      switch (deployEnv) {
        case "production":
          await $`./tools/gcloud-sops-app-deploy.sh dist/libs/staff-shared-server/gae-production.enc.yaml --quiet --project recidiviz-dashboard-production --version ${gaeVersion}`.pipe(
            process.stdout,
          );
          publishReleaseNotes = true;
          break;
        case "demo":
          await $`./tools/gcloud-sops-app-deploy.sh dist/libs/staff-shared-server/gae-staging-demo.enc.yaml --quiet --project recidiviz-dashboard-staging`.pipe(
            process.stdout,
          );
          break;
        default:
          await $`./tools/gcloud-sops-app-deploy.sh dist/libs/staff-shared-server/gae-staging.enc.yaml --quiet --project recidiviz-dashboard-staging`.pipe(
            process.stdout,
          );
          break;
      }
      retryBackend = false;
      successfullyDeployed.push(staffBackendDisplayName);
    } catch (e) {
      const retryBackendPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryBackend",
        message: `${staffBackendDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryBackend = retryBackendPrompt.retryBackend;
    }
  } while (retryBackend);
}

if (deployFrontend) {
  // Build the application
  console.log(`Building ${staffFrontendDisplayName}...`);
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
      successfullyDeployed.push(staffFrontendDisplayName);
    } catch (e) {
      const retryFrontendPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryFrontend",
        message: `${staffFrontendDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryFrontend = retryFrontendPrompt.retryFrontend;
    }
  } while (retryFrontend);
}

if (
  deploySentencing &&
  (deployEnv === "staging" ||
    deployEnv === "production" ||
    deployEnv === "demo")
) {
  let retryDeploy = false;

  do {
    // Deploy the app
    console.log(`Deploying ${sentencingAssistantDisplayName}...`);

    try {
      // We only need to build and push the docker containers if we are
      // 1. deploying to staging
      // 2. deploying a cherry-pick
      // 3. deploying to demo
      // If we're on production, we should use the container that (ideally) should have been pushed in an earlier staging deploy.

      let projects;
      let configuration;
      if (deployEnv === "staging") {
        projects = ["@sentencing/server", "@sentencing/import"];
        configuration = "staging";
      } else if (deployEnv === "production" && isCpDeploy) {
        projects = ["@sentencing/server", "@sentencing/import"];
        configuration = "cherry-pick";
      } else if (deployEnv === "demo") {
        projects = ["@sentencing/server", "@sentencing/seed-demo"];
        configuration = "demo";
      }

      if (projects) {
        await $`COMMIT_SHA=${currentRevision} nx run-many -t container -p ${projects} -c ${configuration}`.pipe(
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
      successfullyDeployed.push(sentencingAssistantDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${sentencingAssistantDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

if (
  deployJiiTexting &&
  (deployEnv === "staging" ||
    deployEnv === "production" ||
    deployEnv === "demo")
) {
  let retryDeploy = false;
  do {
    // Deploy the app
    console.log(`Deploying ${jiiTextingDisplayName}...`);

    try {
      let projects;
      let configuration;
      if (deployEnv === "staging") {
        projects = [
          "@jii-texting/server",
          "@jii-texting/processor",
          "@jii-texting/import",
        ];
        configuration = "staging";
      } else if (deployEnv === "production" && isCpDeploy) {
        projects = [
          "@jii-texting/server",
          "@jii-texting/processor",
          "@jii-texting/import",
        ];
        configuration = "cherry-pick";
      } else if (deployEnv === "demo") {
        projects = [
          "@jii-texting/server",
          "@jii-texting/processor",
          "@jii-texting/seed-demo",
        ];
        configuration = "demo";
      }

      if (projects) {
        await $`COMMIT_SHA=${currentRevision} nx run-many -t container -p ${projects} -c ${configuration}`.pipe(
          process.stdout,
        );
      }

      // Deploy the import, migration, processor, and server infrastructure changes for the applicable environment
      let stack;
      if (deployEnv === "staging") {
        stack = `recidiviz-dashboard-${deployEnv}--jii-texting`;
      } else if (deployEnv === "production") {
        stack = `recidiviz-dashboard-${deployEnv}--jii-texting`;
      } else if (deployEnv === "demo") {
        stack = "recidiviz-dashboard-staging--jii-texting-demo";
      }

      // TODO(#7617) Check if ETL Cloud Run Job is running before DB migration
      await $`yarn atmos:apply apps/jii-texting -s ${stack} -- -auto-approve \
          -var server_container_version=${currentRevision} \
          -var migrate_db_container_version=${currentRevision} \
          -var processor_container_version=${currentRevision} \
          -var import_container_version=${currentRevision}`.pipe(
        process.stdout,
      );

      if (deployEnv === "demo") {
        await $`yarn atmos:apply seed-demo -s recidiviz-dashboard-staging--jii-texting-demo -- -auto-approve`.pipe(
          process.stdout,
        );
      }

      retryDeploy = false;
      successfullyDeployed.push(jiiTextingDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${jiiTextingDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

if (
  deployCaseNotes &&
  (deployEnv === "staging" ||
    deployEnv === "production" ||
    deployEnv === "demo")
) {
  let retryDeploy = false;
  do {
    // Deploy the app
    console.log(`Deploying ${caseNotesDisplayName}...`);

    try {
      // We only need to build and push the docker container if we are
      // 1. deploying to staging.
      // 2. deploying a cherry-pick
      // If we're on production, we should use the container that (ideally) should have been pushed in an earlier staging deploy.
      let configuration;
      if (deployEnv === "staging") {
        configuration = "staging";
      } else if (deployEnv === "production" && isCpDeploy) {
        configuration = "cherry-pick";
      } else if (deployEnv === "demo") {
        configuration = "demo";
      }

      await $`COMMIT_SHA=${currentRevision} nx container case-notes-server --configuration ${configuration}`.pipe(
        process.stdout,
      );

      // Deploy the import, migration, and server infrastructure changes for the applicable environment
      let stack;
      if (deployEnv === "staging") {
        stack = `recidiviz-dashboard-${deployEnv}--case-notes`;
      } else if (deployEnv === "production") {
        stack = `recidiviz-dashboard-${deployEnv}--case-notes`;
      } else if (deployEnv === "demo") {
        stack = "recidiviz-dashboard-staging--case-notes-demo";
      }

      await $`yarn atmos:apply apps/case-notes -s ${stack} -- -auto-approve \
          -var server_container_version=${currentRevision}`.pipe(
        process.stdout,
      );

      retryDeploy = false;
      successfullyDeployed.push(caseNotesDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${caseNotesDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

if (
  // there is no demo backend for Opportunities, it shares the staging backend
  deployOppsBackend &&
  (deployEnv === "staging" || deployEnv === "production")
) {
  let retryDeploy = false;

  do {
    // Deploy the app
    console.log(`Deploying ${opportunitiesBackendDisplayName}...`);

    try {
      await $`nx deploy jii-functions --configuration ${deployEnv}`.pipe(
        process.stdout,
      );

      retryDeploy = false;
      successfullyDeployed.push(opportunitiesBackendDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${opportunitiesBackendDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

if (
  deployOppsFrontend &&
  (deployEnv === "staging" ||
    deployEnv === "production" ||
    deployEnv === "demo")
) {
  // building separately because we want to pass extra args
  // to the deploy command but not the build command
  await $`nx build jii --configuration ${deployEnv}`.pipe(process.stdout);

  let retryDeploy = false;
  do {
    // Deploy the app
    console.log(`Deploying ${opportunitiesFrontendDisplayName}...`);

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
      successfullyDeployed.push(opportunitiesFrontendDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${opportunitiesFrontendDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
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

if (deployEnv === "demo" && deployDemoFixtures) {
  let retryFixtures = false;
  do {
    console.log(`Deploying ${opportunitiesTestDataDisplayName}...`);
    successfullyDeployed.push("Demo fixtures");
    try {
      await $`nx load-demo-fixtures staff -c staging`.pipe(process.stdout);
    } catch (e) {
      const retryFixturesPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryFixtures",
        message: `${opportunitiesTestDataDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryFixtures = retryFixturesPrompt.retryFixtures;
    }
  } while (retryFixtures);
}

if (
  deployReentryBackend &&
  (deployEnv === "staging" ||
    deployEnv === "production" ||
    deployEnv === "demo" ||
    deployEnv === "reentry-dev")
) {
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
      } else if (deployEnv === "reentry-dev") {
        await $`gcloud builds submit apps/@reentry/backend --project recidiviz-rnd-planner --config apps/@reentry/backend/deploy/dev/cloudbuild.yaml --substitutions=COMMIT_SHA=${currentRevision}`.pipe(
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

// TODO(#9213): Add support for demo reentry server deploys
if (
  deployReentryServer &&
  (deployEnv === "staging" || deployEnv === "production")
) {
  let retryDeploy = false;

  do {
    // Deploy the app
    console.log(`Deploying ${reentryBackendV1DisplayName}...`);

    try {
      let projects;
      let configuration;
      if (deployEnv === "staging") {
        projects = ["@reentry/server", "@reentry/import"];
        configuration = "staging";
      } else if (deployEnv === "production" && isCpDeploy) {
        projects = ["@reentry/server", "@reentry/import"];
        configuration = "cherry-pick";
      } else if (deployEnv === "demo") {
        projects = ["@reentry/server", "@reentry/seed-demo"];
        configuration = "demo";
      }

      if (projects) {
        await $`COMMIT_SHA=${currentRevision} nx run-many -t container -p ${projects} -c ${configuration}`.pipe(
          process.stdout,
        );
      }

      // Deploy any changes to the artifact registry if we're on staging
      if (deployEnv === "staging") {
        await $`yarn atmos:apply artifact_registry -s recidiviz-dashboard-${deployEnv}--reentry -- -auto-approve`.pipe(
          process.stdout,
        );
      }

      // Deploy the import, migration, and server infrastructure changes for the applicable environment
      let stack;
      if (deployEnv === "staging") {
        stack = `recidiviz-dashboard-${deployEnv}--reentry`;
      } else if (deployEnv === "production") {
        stack = `recidiviz-dashboard-${deployEnv}--reentry`;
      } else if (deployEnv === "demo") {
        stack = "recidiviz-dashboard-staging--reentry-demo";
      }

      await $`yarn atmos:apply apps/reentry -s ${stack} -- -auto-approve \
          -var server_container_version=${currentRevision} \
          -var migrate_db_container_version=${currentRevision} \
          -var import_container_version=${currentRevision}`.pipe(
        process.stdout,
      );

      if (deployEnv === "demo") {
        // If we're in demo mode, deploy the seed demo job
        await $`yarn atmos:apply apps/reentry-seed-demo -s ${stack} -- -auto-approve -var container_version=${currentRevision}`.pipe(
          process.stdout,
        );
      } else if (deployEnv === "production") {
        await $`yarn atmos:apply postgres-bq-data-transfer -s recidiviz-dashboard-production--reentry -- -auto-approve`.pipe(
          process.stdout,
        );
      }

      retryDeploy = false;
      successfullyDeployed.push(reentryBackendV1DisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${reentryBackendV1DisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
}

if (
  deployReentryFrontend &&
  (deployEnv === "staging" ||
    deployEnv === "production" ||
    deployEnv === "demo" ||
    deployEnv === "reentry-dev")
) {
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
      } else if (deployEnv === "reentry-dev") {
        // have to use dev_gcp instead of (dev) reentry-dev because in project.json dev is already taken for local dev
        // apps/@reentry/frontend/project.json
        await $`COMMIT_SHA=${currentRevision} nx deploy @reentry/frontend --configuration dev_gcp`.pipe(
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

// TODO: Add support for demo meeting assistant deploys
if (
  deployMeetingAssistant &&
  (deployEnv === "staging" || deployEnv === "production")
) {
  let retryDeploy = false;

  do {
    // Deploy the app
    console.log(`Deploying ${meetingAssistantDisplayName} backend services...`);

    try {
      let projects;
      let configuration;
      if (deployEnv === "staging") {
        projects = ["@meetings/server", "@meetings/import"];
        configuration = "staging";
      } else if (deployEnv === "production" && isCpDeploy) {
        projects = ["@meetings/server", "@meetings/import"];
        configuration = "cherry-pick";
      } else if (deployEnv === "demo") {
        projects = ["@meetings/server", "@meetings/seed-demo"];
        configuration = "demo";
      }

      if (projects) {
        await $`COMMIT_SHA=${currentRevision} nx run-many -t container -p ${projects} -c ${configuration}`.pipe(
          process.stdout,
        );
      }

      // Deploy any changes to the artifact registry if we're on staging
      if (deployEnv === "staging") {
        await $`yarn atmos:apply artifact_registry -s recidiviz-dashboard-${deployEnv}--meetings -- -auto-approve`.pipe(
          process.stdout,
        );
      }

      // Deploy the import, migration, and server infrastructure changes for the applicable environment
      let stack;
      if (deployEnv === "staging") {
        stack = `recidiviz-dashboard-${deployEnv}--meetings`;
      } else if (deployEnv === "production") {
        stack = `recidiviz-dashboard-${deployEnv}--meetings`;
      } else if (deployEnv === "demo") {
        stack = "recidiviz-dashboard-staging--meetings-demo";
      }

      await $`yarn atmos:apply apps/meetings -s ${stack} -- -auto-approve \
          -var server_container_version=${currentRevision} \
          -var migrate_db_container_version=${currentRevision} \
          -var import_container_version=${currentRevision}`.pipe(
        process.stdout,
      );

      if (deployEnv === "demo") {
        // If we're in demo mode, deploy the seed demo job
        await $`yarn atmos:apply apps/meetings-seed-demo -s ${stack} -- -auto-approve -var container_version=${currentRevision}`.pipe(
          process.stdout,
        );
      }

      retryDeploy = false;
      successfullyDeployed.push(meetingAssistantDisplayName);
    } catch (e) {
      const retryDeployPrompt = await inquirer.prompt({
        type: "confirm",
        name: "retryDeploy",
        message: `${meetingAssistantDisplayName} deploy failed with error: ${e}. Retry?`,
        default: false,
      });
      retryDeploy = retryDeployPrompt.retryDeploy;
    }
  } while (retryDeploy);
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
const reentryChannelId = "C084GD6MMM0";

let slackChannel = null;
let slackMessage = null;

// Collect any additional channels we want to notify (currently only Reentry).
const additionalSlackChannels = [];
const reentryServiceNames = [
  reentryBackendV0DisplayName,
  reentryBackendV1DisplayName,
  reentryFrontendDisplayName,
];
// Determine if any Reentry services were deployed (v0 backend, v1 backend, or frontend)
const reentryDeployed = successfullyDeployed.some((name) =>
  reentryServiceNames.includes(name),
);

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
} else if (
  successfullyDeployed.length > 0 &&
  ((deployEnv === "demo" && reentryDeployed) || deployEnv === "reentry-dev")
) {
  slackChannel = reentryChannelId;

  let revisionText = "`" + currentRevision + "`";
  if (!deployingLatestMain) revisionText += " (not the tip of main)";

  slackMessage = `${deployer} deployed ${revisionText} to ${deployEnv}!`;
}

if (slackChannel !== null && slackMessage !== null) {
  if (reentryDeployed && slackChannel !== reentryChannelId) {
    additionalSlackChannels.push(reentryChannelId);
  }

  slackMessage += `\nWhat was deployed: ${successfullyDeployed.join(", ")}`;

  // Post to the primary channel plus any additional channels
  const channelsToPost = [slackChannel, ...additionalSlackChannels];

  for (const channel of channelsToPost) {
    try {
      const slackMessageResponse = await slack.chat.postMessage({
        channel,
        text: slackMessage,
        // Don't show previews for Github links
        unfurl_links: false,
        unfurl_media: false,
      });
      if (slackMessageResponse.ok) {
        console.log(`Successfully posted to Slack channel ${channel}`);
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
}

console.log(
  `Finished with the ${deployEnv} deploy! Commit hash: ${currentRevision}`,
);
