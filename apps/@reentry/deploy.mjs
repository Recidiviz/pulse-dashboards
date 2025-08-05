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
import inquirer from "inquirer";
import { inc } from "semver";

// Main function that executes the entire deployment process
async function main() {
  // The default configuration is true, but we explicitly set it here
  // to display gcloud stderr messages
  $.verbose = true;

  // Set the project ID, owner, and repository name
  const projectId = "recidiviz-rnd-planner"; // Replace with your project ID
  const owner = "jessex"; // Replace with your GitHub organization
  const repo = "recidiviz-december-prototype"; // Replace with your repository
  const successfullyDeployed = [];
  let deployingLatestMain = true;
  let octokit = null;

  // for prod
  let nextVersion = "deploy-candidate";

  // Ask which environment to deploy to
  const { deployEnv } = await inquirer.prompt({
    type: "list",
    choices: ["staging", "production", "demo"],
    name: "deployEnv",
    message: "Which environment are you deploying?",
    default: "staging",
  });

  // // Check for uncommitted changes
  // if ((await $`git status --porcelain`).stdout.trim() !== "") {
  //   console.error(
  //     "The Git repository contains uncommitted changes. Make sure the repo is clean before deploying."
  //   );
  //   process.exit(1);
  // }

  console.log("Verifying Google Cloud SDK authentication...");
  try {
    const account = (await $`gcloud config get-value account`).stdout.trim();
    if (!account) {
      throw new Error("No authenticated account found");
    }
    console.log(`✅ Authenticated as: ${account}`);

    // Verify project access
    await $`gcloud projects describe ${projectId}`.catch((err) => {
      console.error(
        `❌ You don't have access to project ${projectId} or the project doesn't exist.`,
      );
      console.error(
        "Run 'gcloud auth login' and ensure you have the necessary permissions.",
      );
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ You are not authenticated with Google Cloud SDK.");
    console.error(
      "Please run 'gcloud auth login' and ensure you have the necessary permissions before using this script.",
    );
    process.exit(1);
  }

  // Getting the current commit hash
  const currentRevision = (await $`git rev-parse --short HEAD`).stdout.trim();
  console.log(`Deploying commit: ${currentRevision}`);

  // Try to access GitHub to verify branch status
  // IMPORTANT: Personal access token needed to get last release number for production deployments
  try {
    // Get GitHub access token from Secret Manager
    console.log("Reading GitHub access token from Secret Manager...");
    const secretClient = new SecretManagerServiceClient({
      projectId,
    });

    const [deployScriptPat] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/github_deploy_script_pat/versions/latest`,
    });

    // Configure Octokit with GitHub token
    octokit = new Octokit({
      auth: deployScriptPat.payload.data.toString(),
    });

    // Production-specific version handling
    if (deployEnv === "production") {
      console.log("Preparing for production deployment...");
      try {
        const latestRelease = await octokit.rest.repos.getLatestRelease({
          owner,
          repo,
        });
        const latestReleaseVersion = latestRelease.data.tag_name;
        console.log(`Latest release version: ${latestReleaseVersion}`);

        // Increment minor version for production
        nextVersion = `v${inc(latestReleaseVersion, "minor")}`;
        console.log(`Next version will be: ${nextVersion}`);
      } catch (error) {
        console.log(
          "Could not fetch latest release. Using v1.0.0 as base version.",
        );
        nextVersion = "v1.0.0";
      }
    }

    // For staging, check if we're on the main branch
    if (deployEnv === "staging" || deployEnv === "demo") {
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
  } catch (error) {
    console.log(
      "Could not verify GitHub or Secret Manager. Continuing with deployment...",
    );
  }

  // Ask which components to deploy
  const deployBackendPrompt = await inquirer.prompt({
    type: "confirm",
    name: "deployBackend",
    message: "Do you want to deploy the backend?",
    default: true,
  });

  // Deploy the backend
  if (deployBackendPrompt.deployBackend) {
    console.log(`Deploying backend to ${deployEnv}...`);

    let retryBackend = false;
    do {
      try {
        // Use appropriate cloudbuild config based on environment
        if (deployEnv === "production") {
          await $`gcloud builds submit --project recidiviz-rnd-planner --config backend/deploy/production/cloudbuild.yaml .`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "demo") {
          await $`gcloud builds submit --project recidiviz-rnd-planner --config backend/deploy/demo/cloudbuild.yaml .`.pipe(
            process.stdout,
          );
        } else {
          await $`gcloud builds submit --project recidiviz-rnd-planner --config backend/deploy/staging/cloudbuild.yaml .`.pipe(
            process.stdout,
          );
        }
        retryBackend = false;
        successfullyDeployed.push("Backend");
      } catch (e) {
        const retryBackendPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryBackend",
          message: `Backend deployment failed with error: ${e}. Retry?`,
          default: false,
        });
        retryBackend = retryBackendPrompt.retryBackend;
      }
    } while (retryBackend);
  }

  // Ask whether to deploy the frontend
  const deployFrontendPrompt = await inquirer.prompt({
    type: "confirm",
    name: "deployFrontend",
    message: "Do you want to deploy the frontend?",
    default: true,
  });

  // Deploy the frontend
  if (deployFrontendPrompt.deployFrontend) {
    console.log(`Deploying frontend to ${deployEnv}...`);

    let retryFrontend = false;
    do {
      try {
        // Use appropriate cloudbuild config based on environment
        if (deployEnv === "production") {
          console.log("Deploying frontend to production... (test message)");
          await $`gcloud builds submit frontend --project recidiviz-rnd-planner --config frontend/deploy/production/cloudbuild.yaml`.pipe(
            process.stdout,
          );
        } else if (deployEnv === "demo") {
          await $`gcloud builds submit frontend --project recidiviz-rnd-planner --config frontend/deploy/demo/cloudbuild.yaml`.pipe(
            process.stdout,
          );
        } else {
          await $`gcloud builds submit frontend --project recidiviz-rnd-planner --config frontend/deploy/staging/cloudbuild.yaml`.pipe(
            process.stdout,
          );
        }
        retryFrontend = false;
        successfullyDeployed.push("Frontend");
      } catch (e) {
        const retryFrontendPrompt = await inquirer.prompt({
          type: "confirm",
          name: "retryFrontend",
          message: `Frontend deployment failed with error: ${e}. Retry?`,
          default: false,
        });
        retryFrontend = retryFrontendPrompt.retryFrontend;
      }
    } while (retryFrontend);
  }

  // For production, create a release tag
  if (deployEnv === "production" && successfullyDeployed.length > 0) {
    console.log("Creating release tag...");
    await $`git tag -m "Version [${nextVersion}] release - $(date +'%Y-%m-%d %H:%M:%S %Z')" "${nextVersion}"`;
    await $`git push origin ${nextVersion}`;
    console.log(
      `✅ Production release tag '${nextVersion}' created and published.`,
    );
  }
  // For staging, create an optional tag
  else if (deployEnv === "staging" && successfullyDeployed.length > 0) {
    const createTagPrompt = await inquirer.prompt({
      type: "confirm",
      name: "createTag",
      message: "Do you want to create a tag for this staging version?",
      default: false,
    });

    if (createTagPrompt.createTag) {
      const tagNamePrompt = await inquirer.prompt({
        type: "input",
        name: "tagName",
        message: "Tag name (will be prefixed with 'staging-')",
        default: new Date().toISOString().split("T")[0],
      });

      const tagName = `staging-${tagNamePrompt.tagName}`;
      await $`git tag -m "Staging deploy [${tagName}] - $(date +'%Y-%m-%d %H:%M:%S %Z')" "${tagName}"`;
      await $`git push origin ${tagName}`;
      console.log(`✅ Tag '${tagName}' created and published.`);
    }
  }

  // Show deployment summary
  console.log(
    `\n✅ ${deployEnv.toUpperCase()} deployment completed. Commit hash: ${currentRevision}`,
  );
  if (deployEnv === "staging" && !deployingLatestMain) {
    console.log(
      "⚠️ Note: A commit that is not the tip of the main branch was deployed.",
    );
  }
  if (deployEnv === "production") {
    console.log(`Release version: ${nextVersion}`);
  }
  console.log(`Components deployed: ${successfullyDeployed.join(", ")}`);

  // Demo-specific post-deployment information
  if (deployEnv === "demo") {
    console.log("\n🚀 Demo deployment notes:");
    console.log(
      "- Demo server is intended for testing and demonstration purposes",
    );
    console.log("- Data may be reset periodically");
    console.log("- Performance may differ from production environment");
  }
}

main().catch((error) => {
  console.error("❌ Error during deployment:", error);
  process.exit(1);
});
