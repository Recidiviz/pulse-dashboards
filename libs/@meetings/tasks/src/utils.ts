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
import { AssemblyAI } from "assemblyai";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import {
  AUDIO_FILE_EXTENSION,
  GCS_CONTENT_TYPE,
} from "~@meetings/tasks/constants";

if (!ffmpegPath) {
  throw new Error("ffmpeg-static failed to load ffmpeg binary");
}

ffmpeg.setFfmpegPath(ffmpegPath);

function isOffline() {
  return process.env["IS_OFFLINE"] === "true";
}

export async function getSignedUrlForNewRecording(
  bucketName: string,
  folderName: string,
) {
  // Make the file name the time since epoch so that files are naturally ordered
  const secondsSinceEpoch = Math.round(Date.now() / 1000);

  // In offline mode, return a local upload endpoint instead of a GCS signed URL
  if (isOffline()) {
    const host = process.env["HOST"] ?? "localhost";
    const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3002;
    const serverUrl = `http://${host}:${port}`;
    return `${serverUrl}/upload-audio/${folderName}/${secondsSinceEpoch}.${AUDIO_FILE_EXTENSION}`;
  }

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);

  const fileName = `${folderName}/${secondsSinceEpoch}.${AUDIO_FILE_EXTENSION}`;
  const file = bucket.file(fileName);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: GCS_CONTENT_TYPE,
  });

  return url;
}

function downloadFilesOffline(
  folderName: string,
  tempFilePaths: string[],
): string | null {
  let fileListContent = "";
  // In offline mode, read files from local storage directory
  const localStorageDir =
    process.env["OFFLINE_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-offline");
  const meetingDir = path.join(localStorageDir, folderName);

  if (!fs.existsSync(meetingDir)) {
    return null;
  }

  const files = fs
    .readdirSync(meetingDir)
    .filter((file) => file.endsWith(`.${AUDIO_FILE_EXTENSION}`));

  if (files.length === 0) {
    return null;
  }

  // Sort files by timestamp to ensure correct order
  files.sort((a, b) => {
    const timeA = parseInt(path.basename(a, `.${AUDIO_FILE_EXTENSION}`));
    const timeB = parseInt(path.basename(b, `.${AUDIO_FILE_EXTENSION}`));
    return timeA - timeB;
  });

  for (const file of files) {
    const filePath = path.join(meetingDir, file);
    tempFilePaths.push(filePath);
    fileListContent += `file '${filePath}'\n`;
  }
  return fileListContent;
}

async function downloadFilesGCS(
  bucketName: string,
  folderName: string,
  tempFilePaths: string[],
): Promise<string | null> {
  let fileListContent = "";

  const storage = new Storage();
  const bucket = storage.bucket(bucketName);

  const [files] = await bucket.getFiles({ prefix: `${folderName}/` });
  if (files.length === 0) {
    return null;
  }

  // Sort files by timestamp to ensure correct order
  files.sort((a, b) => {
    const timeA = parseInt(a.name);
    const timeB = parseInt(b.name);
    return timeA - timeB;
  });

  // Download each file to a temp location and keep a list of the paths
  const downloads = [];
  for (const segmentFile of files) {
    const tempFilePath = path.join(
      os.tmpdir(),
      path.basename(segmentFile.name),
    );

    downloads.push(segmentFile.download({ destination: tempFilePath }));
    tempFilePaths.push(tempFilePath);
    fileListContent += `file '${tempFilePath}'\n`;
  }

  // GCS will auto-retry up to three times with expenential backoff, so we can
  // await all downloads to complete here. If they still fail, we should just
  // throw the error
  await Promise.all(downloads);
  return fileListContent;
}

export async function stitchAudio(bucketName: string, folderName: string) {
  const tempFilePaths: string[] = [];
  const fileListPath = path.join(os.tmpdir(), "filelist.txt");
  let fileListContent = "";

  if (isOffline()) {
    const offlineFileListContent = downloadFilesOffline(
      folderName,
      tempFilePaths,
    );
    if (offlineFileListContent === null) return null;
    fileListContent = offlineFileListContent;
  } else {
    const gcsFileListContent = await downloadFilesGCS(
      bucketName,
      folderName,
      tempFilePaths,
    );
    if (gcsFileListContent === null) return null;
    fileListContent = gcsFileListContent;
  }

  fs.writeFileSync(fileListPath, fileListContent);

  const tempOutputPath = path.join(
    os.tmpdir(),
    `final.${AUDIO_FILE_EXTENSION}`,
  );

  // Use FFmpeg to concatenate the audio files into a single one
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions("-c copy") // Directly copy the stream without re-encoding
      .save(tempOutputPath)
      .on("end", resolve)
      .on("error", reject);
  });

  const outputFileName = `${folderName}/final.${AUDIO_FILE_EXTENSION}`;

  if (isOffline()) {
    // In offline mode, save final file to local storage
    const localStorageDir =
      process.env["OFFLINE_STORAGE_DIR"] ||
      path.join(os.tmpdir(), "meetings-offline");
    const meetingDir = path.join(localStorageDir, folderName);
    const finalPath = path.join(meetingDir, `final.${AUDIO_FILE_EXTENSION}`);
    fs.copyFileSync(tempOutputPath, finalPath);
  } else {
    // Upload the final stitched file back to the bucket
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    await bucket.upload(tempOutputPath, {
      destination: outputFileName,
      metadata: { contentType: GCS_CONTENT_TYPE },
      resumable: false,
    });
  }

  return outputFileName;
}

export async function transcribeAudioWithAssemblyAI(
  bucketName: string,
  finalRecordingFilePath: string,
  apiKey: string,
) {
  let audioUrl: string;

  if (isOffline()) {
    // In offline mode, use local file path
    // Extract meeting ID from the path (format: {meetingId}/final.m4a)
    const meetingId = path.dirname(finalRecordingFilePath);
    const localStorageDir =
      process.env["OFFLINE_STORAGE_DIR"] ||
      path.join(os.tmpdir(), "meetings-offline");
    const localFilePath = path.join(
      localStorageDir,
      meetingId,
      `final.${AUDIO_FILE_EXTENSION}`,
    );

    // AssemblyAI accepts local file paths directly
    audioUrl = localFilePath;
  } else {
    // Online mode: generate signed URL from GCS
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

  // TODO: Add custom speaker labels once the API supports it
  const transcriptionResult = await assemblyAiClient.transcripts.transcribe({
    audio: audioUrl,
    speaker_labels: true,
    format_text: true,
    punctuate: true,
    speech_model: "universal",
    language_detection: true,
  });

  if (transcriptionResult.error) {
    throw new Error(
      `AssemblyAI transcription failed: ${transcriptionResult.error}`,
    );
  }

  return transcriptionResult;
}

export async function cleanupOfflineFiles(meetingId: string) {
  if (!isOffline()) {
    // Only cleanup in offline mode
    return;
  }

  const localStorageDir =
    process.env["OFFLINE_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-offline");
  const meetingDir = path.join(localStorageDir, meetingId);

  if (fs.existsSync(meetingDir)) {
    // Remove all files in the meeting directory
    fs.rmSync(meetingDir, { recursive: true, force: true });
    console.log(`Cleaned up offline files for meeting ${meetingId}`);
  }
}

export async function transcribeAudioWithDeepgram(
  bucketName: string,
  finalRecordingFilePath: string,
  apiKey: string,
) {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);

  const file = bucket.file(finalRecordingFilePath);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  const deepgramClient = createClient(apiKey);

  // TODO(#10407): Add custom speaker labels once the API supports it
  const transcriptionResult =
    await deepgramClient.listen.prerecorded.transcribeUrl(
      { url },
      {
        model: "nova-3",
        punctuate: true,
        diarize: true,
      },
    );

  if (transcriptionResult.error) {
    throw new Error(
      `Deepgram transcription failed: ${transcriptionResult.error}`,
    );
  }

  return transcriptionResult.result;
}
