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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Storage } from "@google-cloud/storage";

/**
 * Writes a Label Studio task as pretty-printed JSON to
 * {recordingsFolderPath}/{fileName} in the meeting's recordings bucket, and
 * returns where it went.
 *
 * In local mode (IS_LOCAL_MODE=true) it writes under LOCAL_STORAGE_DIR, or a
 * meetings-local folder in the OS temp directory, instead of GCS.
 */
export async function writeMeetingTaskFile(
  meeting: { recordingsGCSBucket: string; recordingsFolderPath: string },
  fileName: string,
  task: unknown,
): Promise<string> {
  const taskJson = JSON.stringify(task, null, 2);

  if (process.env["IS_LOCAL_MODE"] === "true") {
    const localStorageDir =
      process.env["LOCAL_STORAGE_DIR"] ??
      path.join(os.tmpdir(), "meetings-local");
    const meetingDir = path.join(localStorageDir, meeting.recordingsFolderPath);
    fs.mkdirSync(meetingDir, { recursive: true });
    const filePath = path.join(meetingDir, fileName);
    fs.writeFileSync(filePath, taskJson);
    return filePath;
  }

  const outputPath = `${meeting.recordingsFolderPath}/${fileName}`;
  const storage = new Storage();
  const file = storage.bucket(meeting.recordingsGCSBucket).file(outputPath);
  await file.save(taskJson, { contentType: "application/json" });
  return `gs://${meeting.recordingsGCSBucket}/${outputPath}`;
}
