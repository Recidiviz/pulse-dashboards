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

import fs from "node:fs";
import os from "node:os";

import { createClient } from "@deepgram/sdk";
import { Storage } from "@google-cloud/storage";
import { AssemblyAI, SpeechUnderstandingFeatureRequests } from "assemblyai";
import ffprobePath from "ffprobe-static";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import { AUDIO_FORMATS } from "~@meetings/config";

ffmpeg.setFfprobePath(ffprobePath.path);

function isLocalMode() {
  return process.env["IS_LOCAL_MODE"] === "true";
}

export async function getSignedUrlForNewRecording(
  bucketName: string,
  folderName: string,
  fileExtension: string,
  contentType: string,
  requestHost?: string,
) {
  // Make the file name the time since epoch so that files are naturally ordered
  const secondsSinceEpoch = Math.round(Date.now() / 1000);

  // In local mode, return a local upload endpoint instead of a GCS signed URL
  if (isLocalMode()) {
    // Prefer the Host header the client actually connected with: `HOST` is the
    // server's bind address (e.g. 0.0.0.0 to accept LAN connections), which is
    // never itself a valid address for a client to connect back to.
    const authority =
      requestHost ??
      `${process.env["HOST"] ?? "localhost"}:${process.env["PORT"] ? Number(process.env["PORT"]) : 3002}`;
    const serverUrl = `http://${authority}`;
    return `${serverUrl}/upload-audio/${folderName}/${secondsSinceEpoch}.${fileExtension}`;
  }

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);

  const fileName = `${folderName}/${secondsSinceEpoch}.${fileExtension}`;
  const file = bucket.file(fileName);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  return url;
}

export async function getSignedUrlForRecording(
  folderName: string,
  bucketName: string,
  fileName: string,
  requestHost?: string,
): Promise<string | null> {
  if (isLocalMode()) {
    const localStorageDir =
      process.env["LOCAL_STORAGE_DIR"] ||
      path.join(os.tmpdir(), "meetings-local");
    if (!fs.existsSync(path.join(localStorageDir, folderName, fileName))) {
      return null;
    }

    // Prefer the Host header the client actually connected with: `HOST` is the
    // server's bind address (e.g. 0.0.0.0 to accept LAN connections), which is
    // never itself a valid address for a client to connect back to.
    const authority =
      requestHost ??
      `${process.env["HOST"] ?? "localhost"}:${process.env["PORT"] ? Number(process.env["PORT"]) : 3002}`;
    const serverUrl = `http://${authority}`;
    return `${serverUrl}/stream-audio/${folderName}/${fileName}`;
  }

  const filePath = `${folderName}/${fileName}`;

  const storage = new Storage();
  const [url] = await storage
    .bucket(bucketName)
    .file(filePath)
    .getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
  return url;
}

export async function deleteRecordingFiles(
  bucketName: string,
  folderPath: string,
) {
  if (isLocalMode()) {
    const localStorageDir =
      process.env["LOCAL_STORAGE_DIR"] ??
      path.join(os.tmpdir(), "meetings-local");
    const dir = path.join(localStorageDir, folderPath);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    return;
  }

  const storage = new Storage();
  await storage.bucket(bucketName).deleteFiles({ prefix: folderPath });
}

const AUDIO_EXTENSIONS = new Set(Object.keys(AUDIO_FORMATS));

function isAudioFile(fileName: string) {
  return AUDIO_EXTENSIONS.has(path.extname(fileName).slice(1));
}

function getAudioDurationMs(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const durationSec = metadata.format.duration ?? 0;
      resolve(Math.round(durationSec * 1000));
    });
  });
}

type UploadedFile = { fileName: string; sizeBytes: number };

// A retried upload leaves more than one file. Names are the upload's epoch
// seconds, so the largest is the latest attempt.
function getNewestRecording(files: UploadedFile[]) {
  const uploadTime = ({ fileName }: UploadedFile) =>
    parseInt(path.parse(path.basename(fileName)).name);
  return files.reduce<UploadedFile | null>(
    (newest, file) =>
      newest === null || uploadTime(file) > uploadTime(newest) ? file : newest,
    null,
  );
}

/**
 * Returns the newest audio file uploaded for a meeting, its length, and every
 * audio file in the folder, or null when the folder holds no audio. For
 * example, a folder holding 1760832000.m4a and a retried 1760832090.m4a
 * returns:
 *
 *   {
 *     filePath: "US_NE/abc123/1760832090.m4a",
 *     durationMs: 1834000,
 *     uploadedFiles: [
 *       { fileName: "US_NE/abc123/1760832000.m4a", sizeBytes: 29360128 },
 *       { fileName: "US_NE/abc123/1760832090.m4a", sizeBytes: 29360128 },
 *     ],
 *   }
 */
export async function findUploadedRecording(
  bucketName: string,
  folderName: string,
): Promise<{
  filePath: string;
  durationMs: number;
  uploadedFiles: UploadedFile[];
} | null> {
  if (isLocalMode()) {
    const localStorageDir =
      process.env["LOCAL_STORAGE_DIR"] ||
      path.join(os.tmpdir(), "meetings-local");
    const meetingDir = path.join(localStorageDir, folderName);
    if (!fs.existsSync(meetingDir)) return null;

    const uploadedFiles = fs
      .readdirSync(meetingDir)
      .filter(isAudioFile)
      .map((fileName) => ({
        fileName: `${folderName}/${fileName}`,
        sizeBytes: fs.statSync(path.join(meetingDir, fileName)).size,
      }));
    const newest = getNewestRecording(uploadedFiles);
    if (!newest) return null;

    return {
      filePath: newest.fileName,
      durationMs: await getAudioDurationMs(
        path.join(localStorageDir, newest.fileName),
      ),
      uploadedFiles,
    };
  }

  const bucket = new Storage().bucket(bucketName);
  const [files] = await bucket.getFiles({ prefix: `${folderName}/` });
  const uploadedFiles = files
    .filter((f) => isAudioFile(f.name))
    .map((f) => ({ fileName: f.name, sizeBytes: Number(f.metadata.size) }));
  const newest = getNewestRecording(uploadedFiles);
  if (!newest) return null;

  // ffprobe needs a local file, and /tmp is tmpfs on Cloud Run, so the
  // directory has to be removed even when the probe fails.
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "recording-"));
  try {
    const tempFilePath = path.join(tempDir, path.basename(newest.fileName));
    await bucket.file(newest.fileName).download({ destination: tempFilePath });

    return {
      filePath: newest.fileName,
      durationMs: await getAudioDurationMs(tempFilePath),
      uploadedFiles,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function getLocalAudioFilePath(finalRecordingFilePath: string) {
  const localStorageDir =
    process.env["LOCAL_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-local");
  const localFilePath = path.join(localStorageDir, finalRecordingFilePath);

  if (!fs.existsSync(localFilePath)) {
    throw new Error("Final file not found");
  }

  return localFilePath;
}

export async function transcribeAudioWithAssemblyAI(
  bucketName: string,
  finalRecordingFilePath: string,
  apiKey: string,
  keywords: string[] = [],
) {
  let audioUrl: string;

  if (isLocalMode()) {
    // In local mode, use local file path
    // AssemblyAI accepts local file paths directly
    audioUrl = getLocalAudioFilePath(finalRecordingFilePath);
  } else {
    // GCS mode: generate signed URL from GCS
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(finalRecordingFilePath);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    audioUrl = url;
  }

  const assemblyAiClient = new AssemblyAI({
    apiKey,
  });

  const speechRequest: SpeechUnderstandingFeatureRequests = {
    speaker_identification: {
      speaker_type: "role",
      known_values: ["Staff", "Client"],
    },
  };

  const transcriptionResult = await assemblyAiClient.transcripts.transcribe({
    audio: audioUrl,
    speaker_labels: true,
    speech_understanding: {
      request: speechRequest,
    },
    format_text: true,
    punctuate: true,
    speech_model: "universal",
    language_detection: true,
    ...(keywords.length > 0 && { keyterms_prompt: keywords }),
  });

  if (transcriptionResult.error) {
    throw new Error(
      `AssemblyAI transcription failed: ${transcriptionResult.error}`,
    );
  }

  return transcriptionResult;
}

/**
 * Deletes local meeting folders ({stateCode}/{meetingId}) that haven't been
 * modified in `maxAgeDays`. Recordings are kept after transcription so they can
 * be played back
 */
export function cleanupStaleLocalFiles(maxAgeDays: number) {
  if (!isLocalMode()) {
    // Only cleanup in local mode
    return;
  }

  const localStorageDir =
    process.env["LOCAL_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-local");
  if (!fs.existsSync(localStorageDir)) {
    return;
  }

  const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const stateDir of fs.readdirSync(localStorageDir, {
    withFileTypes: true,
  })) {
    if (!stateDir.isDirectory()) continue;
    const statePath = path.join(localStorageDir, stateDir.name);

    for (const meetingDir of fs.readdirSync(statePath, {
      withFileTypes: true,
    })) {
      if (!meetingDir.isDirectory()) continue;
      const meetingPath = path.join(statePath, meetingDir.name);

      if (fs.statSync(meetingPath).mtimeMs < cutoffMs) {
        fs.rmSync(meetingPath, { recursive: true, force: true });
        deletedCount += 1;
      }
    }
  }

  if (deletedCount > 0) {
    console.log(
      `Cleaned up local files for ${deletedCount} meeting(s) older than ${maxAgeDays} days`,
    );
  }
}

export async function transcribeAudioWithDeepgram(
  bucketName: string,
  finalRecordingFilePath: string,
  apiKey: string,
  keywords: string[] = [],
) {
  let transcriptionResult;

  if (isLocalMode()) {
    // In local mode, use local file path
    const audioUrl = getLocalAudioFilePath(finalRecordingFilePath);
    const bufferData = fs.readFileSync(audioUrl);

    const deepgramClient = createClient(apiKey);

    transcriptionResult =
      await deepgramClient.listen.prerecorded.transcribeFile(bufferData, {
        model: "nova-3",
        punctuate: true,
        diarize: true,
        summarize: true,
        utterances: true,
        mip_opt_out: true,
        ...(keywords.length > 0 && { keyterm: keywords }),
      });
  } else {
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);

    const file = bucket.file(finalRecordingFilePath);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    const deepgramClient = createClient(apiKey);

    transcriptionResult = await deepgramClient.listen.prerecorded.transcribeUrl(
      { url },
      {
        model: "nova-3",
        punctuate: true,
        diarize: true,
        summarize: true,
        utterances: true,
        mip_opt_out: true,
        ...(keywords.length > 0 && { keyterm: keywords }),
      },
    );
  }

  if (transcriptionResult.error) {
    throw new Error(
      `Deepgram transcription failed: ${transcriptionResult.error}`,
    );
  }

  return transcriptionResult.result;
}
