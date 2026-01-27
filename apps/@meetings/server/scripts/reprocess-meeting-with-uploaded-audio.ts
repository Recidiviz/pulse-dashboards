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

/**
 * Script to manually trigger audio stitching for a meeting with uploaded audio file.
 *
 * This script supports both development and staging modes:
 * - Development: Direct database connection, no authentication
 * - Staging: Via cloud-sql-proxy with service account authentication
 *
 * Mode detection: Based on INSTANCE_CONNECTION_NAME env var presence
 *
 * Steps:
 * 1. Connects to the database (directly in dev, via cloud-sql-proxy in staging)
 * 2. Updates the meeting's finalRecordingGCSPath in Prisma
 * 3. Calls the reprocess-meeting endpoint to trigger stitching
 *
 */

import { ChildProcess, spawn } from "node:child_process";

import { Command } from "@commander-js/extra-typings";

import { getPrismaClientForStateCode } from "~@meetings/prisma";
import { PrismaClient } from "~@meetings/prisma/client";

type VALID_STEPS = ["stitching", "transcription", "notetaking"];
type Step = VALID_STEPS[number];

interface ScriptArgs {
  meetingId: string;
  stateCode: string;
  gcsPath: string;
  step: Step;
}

function parseArgs(): ScriptArgs {
  const program = new Command()
    .name("reprocess-meeting-with-uploaded-audio")
    .description(
      "Manually trigger audio stitching for a meeting with uploaded audio file",
    )
    .requiredOption("--meeting-id <meeting-id>", "Meeting ID to reprocess")
    .requiredOption("--state-code <state-code>", "State code (e.g., US_NE)")
    .requiredOption(
      "--gcs-path <gcs-path>",
      "GCS path to the uploaded audio file (e.g., path/to/audio.m4a)",
    )
    .option(
      "--step <step>",
      "Processing step to execute (stitching, transcription, or notetaking)",
      "transcription",
    )
    .parse();

  const options = program.opts();

  // Validate step value
  const validSteps = ["stitching", "transcription", "notetaking"];
  if (!validSteps.includes(options.step)) {
    console.error(
      `❌ Invalid step: ${options.step}. Must be one of: ${validSteps.join(", ")}`,
    );
    process.exit(1);
  }

  return {
    meetingId: options.meetingId,
    stateCode: options.stateCode,
    gcsPath: options.gcsPath,
    step: options.step as Step,
  };
}

function isDevelopmentConfiguration(): boolean {
  return process.env["NX_TASK_TARGET_CONFIGURATION"] === "development";
}

async function startCloudSqlProxy(): Promise<ChildProcess> {
  const instanceConnectionName = process.env["INSTANCE_CONNECTION_NAME"];

  console.log("🚀 Starting Cloud SQL Proxy...");
  console.log(`   Instance: ${instanceConnectionName}`);

  const proxy = spawn(
    "cloud-sql-proxy",
    ["--port", process.env.CLOUD_SQL_PROXY_PORT, instanceConnectionName],
    {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  proxy.stdout?.on("data", (data) => {
    console.log(`[proxy] ${data.toString().trim()}`);
  });

  proxy.stderr?.on("data", (data) => {
    console.log(`[proxy] ${data.toString().trim()}`);
  });

  // Wait for proxy to be ready
  console.log("⏳ Waiting for Cloud SQL Proxy to be ready...");
  await new Promise<void>((resolve, reject) => {
    let output = "";

    const onData = (data: Buffer) => {
      output += data.toString();
      // Cloud SQL Proxy logs "Ready for new connections" when it's ready
      if (
        output.includes("Ready for new connections") ||
        output.includes("ready for new connections")
      ) {
        proxy.stdout?.off("data", onData);
        proxy.stderr?.off("data", onData);
        resolve();
      }
    };

    proxy.stdout?.on("data", onData);
    proxy.stderr?.on("data", onData);

    proxy.on("error", (error) => {
      reject(new Error(`Failed to start cloud-sql-proxy: ${error.message}`));
    });

    proxy.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`cloud-sql-proxy exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error("Timeout waiting for cloud-sql-proxy to be ready"));
    }, 30000);
  });

  console.log("✅ Cloud SQL Proxy is ready!");
  return proxy;
}

async function updateMeetingFinalRecordingPath(
  prisma: PrismaClient,
  meetingId: string,
  gcsPath: string,
): Promise<void> {
  console.log("\n📝 Updating meeting in database...");
  console.log(`   Meeting ID: ${meetingId}`);
  console.log(`   GCS Path: ${gcsPath}`);

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      finalRecordingGCSPath: gcsPath,
    },
  });

  console.log("✅ Meeting updated successfully!");
}

async function triggerReprocessMeeting(
  stateCode: string,
  meetingId: string,
  step: Step,
  isDevelopment: boolean,
): Promise<void> {
  const endpoint = process.env["REPROCESS_ENDPOINT_URL"];
  const serviceAccount = process.env["CLOUD_TASKS_SERVICE_ACCOUNT_EMAIL"];

  console.log("\n🔄 Triggering reprocess-meeting endpoint...");
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   State Code: ${stateCode}`);
  console.log(`   Meeting ID: ${meetingId}`);
  console.log(`   Step: ${step}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isDevelopment) {
    console.log(`   Service Account: ${serviceAccount}`);

    // Get auth token by impersonating the Cloud Tasks service account
    const { execSync } = await import("node:child_process");
    let token: string;
    try {
      token = execSync(
        `gcloud auth print-identity-token --impersonate-service-account=${serviceAccount} --include-email`,
        {
          encoding: "utf-8",
        },
      ).trim();
    } catch (e) {
      throw new Error(
        `Failed to get auth token for service account ${serviceAccount}. Make sure you have the Service Account Token Creator role.

        \n This can be granted with the following command:
        \n gcloud iam service-accounts add-iam-policy-binding \\
          ${serviceAccount} \\
          --member=user:YOUR_EMAIL@recidiviz.org \\
          --role=roles/iam.serviceAccountTokenCreator \\
          --project=recidiviz-dashboard-staging

          Underlying error:
          ${e}
        `,
      );
    }

    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.log("   Auth: None (development mode)");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      stateCode,
      meetingId,
      step,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to trigger reprocess: ${response.status} ${response.statusText}\n${text}`,
    );
  }

  const result = await response.text();
  console.log("✅ Reprocess triggered successfully!");
  console.log("   Response:", JSON.stringify(result, null, 2));
}

async function main() {
  console.log("🎬 Meetings Audio Reprocessing Script\n");

  // Parse arguments
  const { meetingId, stateCode, gcsPath, step } = parseArgs();

  const isDevelopment = isDevelopmentConfiguration();

  let proxy: ChildProcess | undefined;
  let prisma: PrismaClient | undefined;

  try {
    // Start cloud-sql-proxy only in staging mode
    if (!isDevelopment) {
      proxy = await startCloudSqlProxy();
    } else {
      console.log("⏩ Skipping Cloud SQL Proxy (using direct connection)\n");
    }

    // Create Prisma client
    prisma = getPrismaClientForStateCode(stateCode);

    await prisma.$connect();
    console.log("✅ Connected to database");

    // Update meeting with final recording path
    await updateMeetingFinalRecordingPath(prisma, meetingId, gcsPath);

    // Trigger reprocess endpoint
    await triggerReprocessMeeting(stateCode, meetingId, step, isDevelopment);

    console.log(`\n🎉 All done! The ${step} task has been queued.`);
    console.log("   Monitor the meeting status in the database or logs.");
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  } finally {
    // Cleanup
    if (prisma) {
      await prisma.$disconnect();
      console.log("\n🔌 Disconnected from database");
    }

    if (proxy && !proxy.killed) {
      console.log("🛑 Stopping Cloud SQL Proxy...");
      proxy.kill("SIGTERM");

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        proxy.on("exit", () => resolve());
        setTimeout(() => {
          if (!proxy.killed) {
            proxy.kill("SIGKILL");
          }
          resolve();
        }, 5000);
      });
    }
  }
}

main();
