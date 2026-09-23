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
 * The write actions behind the dashboard's buttons: uploading a replacement
 * audio file, and triggering reprocessing.
 */

import { Storage } from "@google-cloud/storage";
import { spawnSync } from "child_process";
import { extname } from "path";

import { AUDIO_FORMATS, MEETINGS_STATE_CODES } from "~@meetings/config";
import { StateCode } from "~@meetings/prisma/client";
import { fetchMeetingStorageLocation } from "~@meetings/server/scripts/meetings-oncall/data";

export const REPROCESS_STEPS = [
  "stitching",
  "transcription",
  "notetaking",
] as const;
export type ReprocessStep = (typeof REPROCESS_STEPS)[number];

/**
 * Extensions the pipeline can actually stitch. Derived from AUDIO_FORMATS rather
 * than hardcoded: stitchAudio throws "Unexpected file format" for anything not
 * in there, and since it feeds every object in the meeting's folder to ffmpeg,
 * an out-of-range upload breaks later stitches too, not just its own.
 */
const ALLOWED_AUDIO_EXTENSIONS = Object.keys(AUDIO_FORMATS).map(
  (extension) => `.${extension}`,
);

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

/**
 * Values from the page are interpolated into a spawn argv and a GCS object path,
 * so each one is validated against a known-good set rather than trusted.
 */
export function validateStateCode(value: unknown): StateCode {
  if (typeof value !== "string" || !MEETINGS_STATE_CODES.includes(value)) {
    throw new Error(`Unknown state code: ${String(value)}`);
  }
  return value as StateCode;
}

export function validateMeetingId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
    throw new Error(`Invalid meeting id: ${String(value)}`);
  }
  return value;
}

export function validateStep(value: unknown): ReprocessStep {
  if (
    typeof value !== "string" ||
    !REPROCESS_STEPS.includes(value as ReprocessStep)
  ) {
    throw new Error(`Invalid step: ${String(value)}`);
  }
  return value as ReprocessStep;
}

/**
 * Uploads replacement audio next to the meeting's existing recordings and
 * returns the bucket-relative path the reprocess endpoint expects.
 *
 * The object is written under a new timestamped name rather than overwriting
 * `final.*`, so the original stitched audio stays recoverable.
 */
export async function uploadReplacementAudio(options: {
  dbUrlTemplate: string;
  stateCode: StateCode;
  meetingId: string;
  filename: string;
  body: Buffer;
}): Promise<{ gcsPath: string; bucket: string }> {
  const { dbUrlTemplate, stateCode, meetingId, filename, body } = options;

  if (body.length === 0) {
    throw new Error("Uploaded file was empty");
  }

  const extension = extname(filename).toLowerCase();
  if (!ALLOWED_AUDIO_EXTENSIONS.includes(extension)) {
    throw new Error(
      `Unsupported audio extension "${extension}". Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
    );
  }

  const location = await fetchMeetingStorageLocation(
    dbUrlTemplate,
    stateCode,
    meetingId,
  );
  if (!location) {
    throw new Error(`Meeting ${meetingId} not found in ${stateCode}`);
  }

  const gcsPath = `${location.folderPath}/reupload-${Date.now()}${extension}`;

  await new Storage()
    .bucket(location.bucket)
    .file(gcsPath)
    .save(body, { resumable: false });

  return { gcsPath, bucket: location.bucket };
}

/**
 * Triggers reprocessing by invoking the existing `reprocess-meeting` target,
 * so this dashboard and the standalone script stay on one code path (and this
 * script needs no endpoint URL or GCP token of its own).
 */
export function triggerReprocess(options: {
  configuration: string;
  stateCode: StateCode;
  meetingId: string;
  step: ReprocessStep;
  gcsPath?: string;
}): string {
  const { configuration, stateCode, meetingId, step, gcsPath } = options;

  const args = [
    "reprocess-meeting",
    "@meetings/server",
    `--configuration=${configuration}`,
    `--meeting-id=${meetingId}`,
    `--state-code=${stateCode}`,
    `--step=${step}`,
  ];
  if (gcsPath) {
    args.push(`--gcs-path=${gcsPath}`);
  }

  const result = spawnSync("nx", args, { shell: false, encoding: "utf-8" });

  if (result.error) {
    throw result.error;
  }

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (result.status !== 0) {
    throw new Error(
      `nx ${args.join(" ")} exited ${result.status}\n\n${output}`.trim(),
    );
  }

  return output || "Reprocess target completed with no output.";
}
