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

import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";

import { AbortError } from "~@meetings/app/shared/lib/errors";

import { UploadSegmentParams } from "../../../shared/api";

export async function uploadSegment({
  uri,
  meetingId,
  onProgress,
  onNetworkType,
  signal,
  contentType,
  fileExtension,
  createSignedUrlForRecording,
}: UploadSegmentParams) {
  onNetworkType?.((await NetInfo.fetch()).type ?? "unknown");

  const fileInfo = await FileSystem.getInfoAsync(uri);

  if (!fileInfo.exists) {
    throw new Error("The file could not be found.");
  }

  const signedUrl = await createSignedUrlForRecording({
    meetingId,
    contentType,
    fileExtension,
  });

  if (!signedUrl) {
    throw new Error("Could not get signed URL for recording.");
  }

  const task = FileSystem.createUploadTask(
    signedUrl,
    uri,
    {
      httpMethod: "PUT",
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { "Content-Type": contentType },
    },
    (data) => onProgress?.(data.totalBytesSent, data.totalBytesExpectedToSend),
  );

  if (signal) {
    signal.onabort = () => task.cancelAsync();
  }

  const result = await task.uploadAsync();

  if (signal?.aborted) {
    throw new AbortError();
  }

  if (!result || result.status < 200 || result.status >= 300) {
    throw new Error(result?.body || "Could not upload audio recording.");
  }
}
