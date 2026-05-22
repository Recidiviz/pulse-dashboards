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
import ffprobePath from "ffprobe-static";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import { AUDIO_FORMATS } from "~@meetings/config";

if (!ffmpegPath) {
  throw new Error("ffmpeg-static failed to load ffmpeg binary");
}

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

function isLocalMode() {
  return process.env["IS_LOCAL_MODE"] === "true";
}

export async function getSignedUrlForNewRecording(
  bucketName: string,
  folderName: string,
  fileExtension: string,
  contentType: string,
) {
  // Make the file name the time since epoch so that files are naturally ordered
  const secondsSinceEpoch = Math.round(Date.now() / 1000);

  // In local mode, return a local upload endpoint instead of a GCS signed URL
  if (isLocalMode()) {
    const host = process.env["HOST"] ?? "localhost";
    const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3002;
    const serverUrl = `http://${host}:${port}`;
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
): Promise<string> {
  if (isLocalMode()) {
    const host = process.env["HOST"] ?? "localhost";
    const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3002;
    const serverUrl = `http://${host}:${port}`;
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

function downloadFilesLocal(
  folderName: string,
  tempFilePaths: string[],
): string | null {
  let fileListContent = "";
  // In local mode, read files from local storage directory
  const localStorageDir =
    process.env["LOCAL_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-local");
  const meetingDir = path.join(localStorageDir, folderName);

  if (!fs.existsSync(meetingDir)) {
    return null;
  }

  const audioExtensions = new Set(Object.keys(AUDIO_FORMATS));
  const files = fs
    .readdirSync(meetingDir)
    .filter((f) => audioExtensions.has(path.extname(f).slice(1)));

  if (files.length === 0) {
    return null;
  }

  // Sort files by timestamp to ensure correct order
  files.sort((a, b) => {
    // Extract timestamp from filename (before the extension)
    const timeA = parseInt(path.parse(a).name);
    const timeB = parseInt(path.parse(b).name);
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

function getAudioDurationMs(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const durationSec = metadata.format.duration ?? 0;
      resolve(Math.round(durationSec * 1000));
    });
  });
}

export async function stitchAudio(bucketName: string, folderName: string) {
  const tempFilePaths: string[] = [];
  const fileListPath = path.join(os.tmpdir(), "filelist.txt");
  let fileListContent = "";

  if (isLocalMode()) {
    const localFileListContent = downloadFilesLocal(folderName, tempFilePaths);
    if (localFileListContent === null) return null;
    fileListContent = localFileListContent;
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

  const extension = path.extname(tempFilePaths[0]).slice(1);
  const contentType =
    AUDIO_FORMATS[extension as keyof typeof AUDIO_FORMATS]?.contentType;

  if (!contentType) {
    throw new Error("Unexpected file format");
  }

  const tempOutputPath = path.join(os.tmpdir(), `final.${extension}`);

  console.log(
    `Starting ffmpeg concatenation. Output will be: ${tempOutputPath}`,
  );

  // Use FFmpeg to concatenate the audio files into a single one
  await new Promise((resolve, reject) => {
    ffmpeg({ logger: console })
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions("-c copy") // Directly copy the stream without re-encoding
      .save(tempOutputPath)
      .on("start", (commandLine) => {
        console.log(`FFmpeg command: ${commandLine}`);
      })
      .on("progress", (progress) => {
        console.log(`FFmpeg progress: ${JSON.stringify(progress)}`);
      })
      .on("stderr", (stderrLine) => {
        console.log(`FFmpeg stderr: ${stderrLine}`);
      })
      .on("end", () => {
        console.log("FFmpeg concatenation completed successfully");
        resolve(undefined);
      })
      .on("error", (err, stdout, stderr) => {
        console.error("FFmpeg error occurred:");
        console.error(`Error object: ${err.message}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        reject(err);
      });
  });

  const outputFileName = `${folderName}/final.${extension}`;

  if (isLocalMode()) {
    // In local mode, save final file to local storage
    const localStorageDir =
      process.env["LOCAL_STORAGE_DIR"] ||
      path.join(os.tmpdir(), "meetings-local");
    const meetingDir = path.join(localStorageDir, folderName);
    const finalPath = path.join(meetingDir, `final.${extension}`);
    fs.copyFileSync(tempOutputPath, finalPath);
  } else {
    // Upload the final stitched file back to the bucket
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);
    await bucket.upload(tempOutputPath, {
      destination: outputFileName,
      metadata: { contentType },
      resumable: false,
    });
  }

  const durationMs = await getAudioDurationMs(tempOutputPath);

  return { outputFileName, durationMs };
}

function getLocalAudioFilePath(finalRecordingFilePath: string) {
  // Extract meeting ID from the path (format: {meetingId}/final.{extension})
  const meetingId = path.dirname(finalRecordingFilePath);
  const localStorageDir =
    process.env["LOCAL_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-local");
  const meetingDir = path.join(localStorageDir, meetingId);

  const files = fs.readdirSync(meetingDir);
  const finalFile = files.find((f) => f.startsWith("final."));

  if (!finalFile) {
    throw new Error("Final file not found");
  }

  return path.join(meetingDir, finalFile);
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

  // TODO: Add custom speaker labels once the API supports it
  const transcriptionResult = await assemblyAiClient.transcripts.transcribe({
    audio: audioUrl,
    speaker_labels: true,
    format_text: true,
    punctuate: true,
    speech_model: "universal",
    language_detection: true,
    summarization: true,
    summary_model: "conversational",
    summary_type: "bullets_verbose",
    ...(keywords.length > 0 && { keyterms_prompt: keywords }),
  });

  if (transcriptionResult.error) {
    throw new Error(
      `AssemblyAI transcription failed: ${transcriptionResult.error}`,
    );
  }

  return transcriptionResult;
}

export async function cleanupLocalFiles(meetingId: string) {
  if (!isLocalMode()) {
    // Only cleanup in local mode
    return;
  }

  const localStorageDir =
    process.env["LOCAL_STORAGE_DIR"] ||
    path.join(os.tmpdir(), "meetings-local");
  const meetingDir = path.join(localStorageDir, meetingId);

  if (fs.existsSync(meetingDir)) {
    // Remove all files in the meeting directory
    fs.rmSync(meetingDir, { recursive: true, force: true });
    console.log(`Cleaned up local files for meeting ${meetingId}`);
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
