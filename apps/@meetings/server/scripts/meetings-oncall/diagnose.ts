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
 * Inspects a meeting's GCS folder and reports likely causes of a stitching
 * failure.
 *
 * Nothing about a stitching error is persisted — the database only records
 * `STITCHING_ERROR` — so the surviving audio objects are the primary evidence.
 * They do survive: the failure path only clears the local temp dir, and the
 * artifact cleanup job skips meetings whose `endTime` is null, which is the case
 * for anything that never stitched successfully.
 *
 * The checks below mirror the failure modes in `stitchAudio`
 * (libs/@meetings/tasks/src/utils.ts).
 */

import { Storage } from "@google-cloud/storage";
import { extname } from "path";

import { AUDIO_FORMATS } from "~@meetings/config";
import { StateCode } from "~@meetings/prisma/client";
import { fetchMeetingStorageLocation } from "~@meetings/server/scripts/meetings-oncall/data";
import {
  Mp4Probe,
  probeMp4,
} from "~@meetings/server/scripts/meetings-oncall/probe-mp4";

const AUDIO_EXTENSIONS = new Set(
  Object.keys(AUDIO_FORMATS).map((extension) => `.${extension}`),
);

/** Extensions that use the MP4 box structure, so `probeMp4` applies. */
const MP4_EXTENSIONS = new Set([".m4a", ".mp4"]);

/**
 * Cap on how many files get byte-probed per meeting. Each probe is a few small
 * ranged reads, but a long meeting can have many chunks and this runs while
 * someone waits on a dashboard.
 */
const MAX_PROBES = 24;

export interface GCSObject {
  name: string;
  /** Object name relative to the meeting's folder. */
  basename: string;
  size: number;
  contentType: string | undefined;
  updated: string | undefined;
  isAudio: boolean;
  /** Present only for MP4-family files that were byte-probed. */
  mp4?: Mp4Probe;
}

export type FindingLevel = "error" | "warn" | "info";

export interface Finding {
  level: FindingLevel;
  message: string;
}

export interface Diagnosis {
  bucket: string;
  folderPath: string;
  objects: GCSObject[];
  findings: Finding[];
}

/**
 * Container-level problems, which object metadata cannot reveal: a healthy size
 * and content type say nothing about whether the file is actually decodable.
 */
function buildMp4Findings(objects: GCSObject[]): Finding[] {
  const findings: Finding[] = [];
  const probed = objects.filter((object) => object.mp4);

  const noMoov = probed.filter(
    (object) =>
      object.mp4?.hasMdat && !object.mp4.hasMoov && !object.mp4.boxLimitReached,
  );
  if (noMoov.length) {
    findings.push({
      level: "error",
      message: `${noMoov.length} file(s) have media data but no “moov” atom: ${noMoov.map((o) => o.basename).join(", ")}. The recording was interrupted before the index was written — the audio bytes are there but nothing can decode them. This is the usual cause of ffmpeg's “Invalid data found when processing input”.`,
    });
  }

  const boxLimitHit = probed.filter((object) => object.mp4?.boxLimitReached);
  if (boxLimitHit.length) {
    findings.push({
      level: "warn",
      message:
        `${boxLimitHit.length} file(s) hit the box-scan limit before the ` +
        `full structure was read: ${boxLimitHit.map((o) => o.basename).join(", ")}. ` +
        `The "moov" atom may exist past the scan window.`,
    });
  }

  const truncated = probed.filter(
    (object) => object.mp4?.truncatedAt !== undefined,
  );
  if (truncated.length) {
    findings.push({
      level: "error",
      message: `${truncated.length} truncated file(s): ${truncated
        .map(
          (o) =>
            `${o.basename} (a box at offset ${o.mp4?.truncatedAt} runs past the end of the object)`,
        )
        .join(", ")}. The upload did not finish.`,
    });
  }

  const unparseable = probed.filter((object) => object.mp4?.parseError);
  if (unparseable.length) {
    findings.push({
      level: "error",
      message: `${unparseable.length} file(s) are not readable as MP4: ${unparseable
        .map((o) => `${o.basename} — ${o.mp4?.parseError}`)
        .join("; ")}`,
    });
  }

  const noFtyp = probed.filter(
    (object) => !object.mp4?.parseError && !object.mp4?.hasFtyp,
  );
  if (noFtyp.length) {
    findings.push({
      level: "warn",
      message: `${noFtyp.length} file(s) have no “ftyp” box: ${noFtyp.map((o) => o.basename).join(", ")}. Unusual for a recorder and often a sign of a partial write.`,
    });
  }

  const healthy = probed.filter(
    (object) =>
      object.mp4?.hasMoov &&
      object.mp4.truncatedAt === undefined &&
      !object.mp4.parseError,
  );
  if (healthy.length && healthy.length === probed.length) {
    findings.push({
      level: "info",
      message: `All ${healthy.length} probed MP4 file(s) have a “moov” atom and a complete box structure, so the containers themselves look intact.`,
    });
  }

  return findings;
}

/**
 * `stitchAudio` lists the meeting folder with no extension filter and feeds
 * everything it finds to ffmpeg's concat list, so non-audio objects sitting in
 * the folder are a real failure cause rather than a cosmetic oddity.
 */
export function buildFindings(
  objects: GCSObject[],
  finalRecordingGCSPath: string | null,
): Finding[] {
  const findings: Finding[] = [];

  if (objects.length === 0) {
    findings.push({
      level: "error",
      message:
        "Folder is empty — the recording never made it off the device. This is the “No audio files found to stitch” failure.",
    });
    return findings;
  }

  const audio = objects.filter((object) => object.isAudio);
  const nonAudio = objects.filter((object) => !object.isAudio);

  if (audio.length === 0) {
    findings.push({
      level: "error",
      message: `No objects with a supported audio extension (${[...AUDIO_EXTENSIONS].join(", ")}).`,
    });
  }

  const empty = objects.filter((object) => object.size === 0);
  if (empty.length) {
    findings.push({
      level: "error",
      message: `${empty.length} zero-byte object(s): ${empty.map((o) => o.basename).join(", ")}. ffmpeg reports “Invalid data found when processing input” on these.`,
    });
  }

  if (nonAudio.length) {
    findings.push({
      level: "error",
      message: `${nonAudio.length} non-audio object(s) in the folder: ${nonAudio.map((o) => o.basename).join(", ")}. stitchAudio does not filter by extension, so these are passed to ffmpeg too.`,
    });
  }

  const extensions = new Set(
    audio.map((object) => extname(object.basename).toLowerCase()),
  );
  if (extensions.size > 1) {
    findings.push({
      level: "error",
      message: `Mixed audio extensions (${[...extensions].join(", ")}). Stitching uses “-c copy” with the first file's format, so mismatched codecs fail.`,
    });
  }

  const leftoverFinal = objects.filter((object) =>
    object.basename.startsWith("final."),
  );
  if (leftoverFinal.length && !finalRecordingGCSPath) {
    findings.push({
      level: "warn",
      message: `A stitched “${leftoverFinal[0].basename}” exists in GCS but the meeting has no finalRecordingGCSPath — stitching likely failed at the ffprobe duration step, after the upload.`,
    });
  } else if (leftoverFinal.length) {
    findings.push({
      level: "info",
      message: `Folder contains “${leftoverFinal[0].basename}”. A re-stitch would include it as an input, duplicating the audio.`,
    });
  }

  const reuploads = objects.filter((object) =>
    object.basename.startsWith("reupload-"),
  );
  if (reuploads.length) {
    findings.push({
      level: "info",
      message: `${reuploads.length} re-uploaded file(s) from this dashboard. A re-stitch would include them as inputs.`,
    });
  }

  findings.push(...buildMp4Findings(objects));

  if (findings.length === 0) {
    findings.push({
      level: "info",
      message: `${audio.length} audio chunk(s) present and nothing obviously wrong. Check the Sentry and Cloud Logging links for the ffmpeg stderr.`,
    });
  }

  return findings;
}

export async function diagnoseMeeting(options: {
  dbUrlTemplate: string;
  stateCode: StateCode;
  meetingId: string;
}): Promise<Diagnosis> {
  const { dbUrlTemplate, stateCode, meetingId } = options;

  const location = await fetchMeetingStorageLocation(
    dbUrlTemplate,
    stateCode,
    meetingId,
  );
  if (!location) {
    throw new Error(`Meeting ${meetingId} not found in ${stateCode}`);
  }

  const bucket = new Storage().bucket(location.bucket);
  const [files] = await bucket.getFiles({
    prefix: `${location.folderPath}/`,
  });

  const objects: GCSObject[] = files
    .map((file) => {
      const basename = file.name.slice(location.folderPath.length + 1);
      return {
        name: file.name,
        basename,
        // `getFiles` already returns metadata, so no extra round trip is needed.
        size: Number(file.metadata.size ?? 0),
        contentType: file.metadata.contentType,
        updated: file.metadata.updated,
        isAudio: AUDIO_EXTENSIONS.has(extname(basename).toLowerCase()),
      };
    })
    .sort((a, b) => a.basename.localeCompare(b.basename));

  // Probe newest-first: when a recording is cut short, the damaged chunk is the
  // last one written, so the interesting file is at the end of the listing.
  const probeTargets = objects
    .filter(
      (object) =>
        object.size > 0 &&
        MP4_EXTENSIONS.has(extname(object.basename).toLowerCase()),
    )
    .slice(-MAX_PROBES);

  await Promise.all(
    probeTargets.map(async (object) => {
      const file = bucket.file(object.name);
      try {
        object.mp4 = await probeMp4(async (start, end) => {
          const [buffer] = await file.download({ start, end });
          return buffer;
        }, object.size);
      } catch (error) {
        object.mp4 = {
          boxes: [],
          hasFtyp: false,
          hasMoov: false,
          hasMdat: false,
          parseError: `Could not read the file: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),
  );

  return {
    bucket: location.bucket,
    folderPath: location.folderPath,
    objects,
    findings: buildFindings(objects, location.finalRecordingGCSPath),
  };
}
