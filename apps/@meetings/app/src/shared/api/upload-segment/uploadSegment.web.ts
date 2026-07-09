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

import { AbortError } from "~@meetings/app/shared/lib/errors";

import { UploadSegmentParams } from "./types";

type Connection = Navigator & {
  connection?: { type?: string; effectiveType?: string };
};

function getNetworkType() {
  const connection = (navigator as Connection).connection;
  return connection?.type ?? connection?.effectiveType ?? "unknown";
}

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
  onNetworkType?.(getNetworkType());

  const response = await fetch(uri);

  if (!response.ok) {
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

  const blob = await response.blob();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(e.loaded, e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(xhr.responseText || "Could not upload audio recording."),
        );
      }
    };
    xhr.onabort = () => reject(new AbortError());
    xhr.onerror = () => {
      reject(
        new Error(xhr.responseText || "Could not upload audio recording."),
      );
    };

    if (signal) {
      signal.onabort = () => xhr.abort();
    }

    xhr.send(blob);
  });
}
