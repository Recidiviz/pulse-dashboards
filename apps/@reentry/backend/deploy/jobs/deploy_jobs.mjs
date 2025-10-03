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

import "zx/globals";

import inquirer from "inquirer";

// Jobs
const JOBS = {
  "force-db": {
    name: "force-db", // same as the entrypoint file eg "entrypoints/entrypoint.force-db.sh"
    description: "Empty and recreate the database",
    environments: ["demo"], // environments where this job is applicable
  },
  seed: {
    name: "seed",
    description: "Seed database with initial data",
    environments: ["demo"], // environments where this job is applicable
  },
  requeue: {
    name: "requeue",
    description: "Requeue failed tasks",
    environments: ["staging", "demo"], // environments where this job is applicable
  },
  "retry-plan-gens": {
    name: "retry-plan-gens",
    description: "Regenerate all plans from a set date",
    environments: ["staging", "demo", "prod"], // environments where this job is applicable
  },
  "investigate-failures": {
    name: "investigate-failures",
    description:
      "Investigate stuck and failed executions with detailed client context",
    environments: ["staging", "demo", "prod"], // environments where this job is applicable
  },
  "demo-migrate-ids": {
    name: "demo-migrate-ids",
    description: "populates pseudo_id fields",
    environments: ["demo"], // environments where this job is applicable
  },
  "staging-migrate-ids": {
    name: "staging-migrate-ids",
    description: "populates pseudo_id fields",
    environments: ["staging"], // environments where this job is applicable
  },
  "prod-migrate-ids": {
    name: "prod-migrate-ids",
    description: "populates pseudo_id fields",
    environments: ["prod"], // environments where this job is applicable
  },
  "demo-update-recording-status": {
    name: "demo-update-recording-status",
    description: "Update the status of a recording session.",
    environments: ["demo"],
  },
  "prod-update-recording-status": {
    name: "prod-update-recording-status",
    description: "Update the status of a recording session.",
    environments: ["prod"],
  },
  "force-assessment-from-env": {
    name: "force-assessment-from-env",
    description:
      "Force regenerate assessment for client specified in env config",
    environments: ["demo", "staging", "prod"],
  },
};

async function main() {
  $.verbose = true;

  console.log("Job Deployment Script");
  console.log("========================\n");

  // Verify gcloud authentication
  console.log("Verifying Google Cloud SDK authentication...");
  try {
    const account = (await $`gcloud config get-value account`).stdout.trim();
    if (!account) {
      throw new Error("No authenticated account found");
    }
    console.log(`Authenticated as: ${account}\n`);
  } catch {
    console.error("You are not authenticated with Google Cloud SDK.");
    console.error("Please run 'gcloud auth login' first.");
    process.exit(1);
  }

  // Select job to deploy
  const { selectedJob } = await inquirer.prompt({
    type: "list",
    name: "selectedJob",
    message: "Which job do you want to deploy?",
    choices: Object.keys(JOBS).map((key) => ({
      name: `${key} - ${JOBS[key].description}`,
      value: key,
    })),
  });

  // Select environment
  const { environment } = await inquirer.prompt({
    type: "list",
    name: "environment",
    message: "Select environment:",
    choices: JOBS[selectedJob].environments,
    default: "demo",
  });

  // Confirm deployment
  const { confirm } = await inquirer.prompt({
    type: "confirm",
    name: "confirm",
    message: `Deploy job '${selectedJob}' to ${environment}? (IMPORTANT- this only deploys the job, it does not run it)`,
    default: true,
  });

  if (!confirm) {
    console.log("❌ Deployment cancelled.");
    process.exit(0);
  }

  // Deploy the job
  console.log(`\nDeploying job '${selectedJob}' to ${environment}...`);
  try {
    const command = `gcloud builds submit --config=backend/deploy/jobs/cloudbuild.yaml --substitutions=_JOB_NAME=${selectedJob},_ENVIRONMENT=${environment} .`;
    console.log(`Running: ${command}\n`);

    await $`cd ../../ && gcloud builds submit --project=recidiviz-rnd-planner --config=deploy/jobs/cloudbuild.yaml --substitutions=_JOB_NAME=${selectedJob},_ENVIRONMENT=${environment} .`.pipe(
      process.stdout,
    );

    console.log(
      `\nJob '${selectedJob}' successfully deployed to ${environment}!`,
    );
  } catch (error) {
    console.error(`Job deployment failed:`, error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Script error:", error);
  process.exit(1);
});
