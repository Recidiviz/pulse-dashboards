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

import { Storage } from "@google-cloud/storage";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import {
  AUDIO_FILE_EXTENSION,
  GCS_CONTENT_TYPE,
} from "~@meetings/trpc/common/constants";

if (!ffmpegPath) {
  throw new Error("ffmpeg-static failed to load ffmpeg binary");
}

ffmpeg.setFfmpegPath(ffmpegPath);

export async function stitchAudioForMeeting(
  gcsBucketName: string,
  meetingFolderName: string,
) {
  // Get the list of audio files for this meeting
  const storage = new Storage();
  const bucket = storage.bucket(gcsBucketName);

  const [files] = await bucket.getFiles({ prefix: `${meetingFolderName}/` });
  if (files.length === 0) {
    return;
  }

  // Sort files by timestamp to ensure correct order
  files.sort((a, b) => {
    const timeA = parseInt(a.name);
    const timeB = parseInt(b.name);
    return timeA - timeB;
  });

  // Download each file to a temp location and keep a list of the paths
  const tempFilePaths = [];
  const fileListPath = path.join(os.tmpdir(), "filelist.txt");
  let fileListContent = "";

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

  // Upload the final stitched file back to the bucket
  const outputFileName = `${meetingFolderName}/final.${AUDIO_FILE_EXTENSION}`;
  await bucket.upload(tempOutputPath, {
    destination: outputFileName,
    metadata: { contentType: GCS_CONTENT_TYPE },
    resumable: false,
  });

  return `${gcsBucketName}/${outputFileName}`;
}
