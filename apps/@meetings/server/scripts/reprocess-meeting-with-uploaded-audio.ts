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
 * Manually triggers reprocessing for a meeting, optionally with an uploaded audio file.
 *
 * Calls the reprocess-meeting endpoint, which will update the meeting's
 * finalRecordingGCSPath (if gcsPath is provided) and queue the specified
 * processing step.
 *
 * Run `nx reprocess-meeting @meetings/server --args="--help"` for usage.
 */

import { Command, Option } from "@commander-js/extra-typings";
import { GoogleAuth } from "google-auth-library";

const VALID_STEPS = ["stitching", "transcription", "notetaking"] as const;
type Step = (typeof VALID_STEPS)[number];

interface ScriptArgs {
  meetingId: string;
  stateCode: string;
  gcsPath?: string;
  step?: Step;
}

function parseArgs(): ScriptArgs {
  const program = new Command()
    .name("reprocess-meeting-with-uploaded-audio")
    .description(
      "Manually trigger audio stitching for a meeting with uploaded audio file",
    )
    .requiredOption("--meeting-id <meeting-id>", "Meeting ID to reprocess")
    .requiredOption("--state-code <state-code>", "State code (e.g., US_NE)")
    .option(
      "--gcs-path <gcs-path>",
      "Optional GCS path to the uploaded audio file (e.g., path/to/audio.m4a). When provided, the server updates the meeting's finalRecordingGCSPath before queuing the task.",
    )
    .addOption(
      new Option(
        "--step <step>",
        "Optional processing step to execute (stitching, transcription, or notetaking). If omitted, the step is inferred from the meeting's current processing status.",
      ).choices(VALID_STEPS),
    )
    .parse();

  const options = program.opts();

  return {
    meetingId: options.meetingId,
    stateCode: options.stateCode,
    gcsPath: options.gcsPath,
    step: options.step,
  };
}

function isDevelopmentConfiguration(): boolean {
  return process.env["NX_TASK_TARGET_CONFIGURATION"] === "development";
}

async function triggerReprocessMeeting(
  stateCode: string,
  meetingId: string,
  isDevelopment: boolean,
  step?: Step,
  gcsPath?: string,
): Promise<void> {
  const endpoint = process.env["REPROCESS_ENDPOINT_URL"];
  if (!endpoint) {
    throw new Error("Missing value for REPROCESS_ENDPOINT_URL");
  }

  console.log("\n🔄 Triggering reprocess-meeting endpoint...");
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   State Code: ${stateCode}`);
  console.log(`   Meeting ID: ${meetingId}`);
  console.log(`   Step: ${step}`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!isDevelopment) {
    const auth = new GoogleAuth();
    const idTokenClient = await auth.getIdTokenClient(endpoint);
    const gcpHeaders = await idTokenClient.getRequestHeaders();
    Object.assign(headers, gcpHeaders);

    console.log(`   Running with user credentials`);
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
      gcsPath,
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

  try {
    // Trigger reprocess endpoint (passes gcsPath so the server updates the DB)
    await triggerReprocessMeeting(
      stateCode,
      meetingId,
      isDevelopment,
      step,
      gcsPath,
    );

    console.log(`\n🎉 All done! The ${step} task has been queued.`);
    console.log("   Monitor the meeting status in the database or logs.");
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main();
