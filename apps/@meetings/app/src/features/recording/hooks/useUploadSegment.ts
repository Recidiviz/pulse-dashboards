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

import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { trpc } from "~@meetings/app/trpc/client";

type Params = {
  uri: string;
  meetingId: string;
  createSignedUrlForRecording: (params: {
    meetingId: string;
    platform: "web" | "ios" | "android";
  }) => Promise<string | null>;
};

const uploadSegmentWeb = async ({
  uri,
  meetingId,
  createSignedUrlForRecording,
}: Params) => {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("The file could not be found.");
  }

  const signedUrl = await createSignedUrlForRecording({
    meetingId: meetingId,
    platform: "web",
  });

  if (!signedUrl) {
    throw new Error("Could not get signed URL for recording.");
  }

  const blob = await response.blob();
  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": "audio/webm" },
  });

  if (!uploadResponse.ok) {
    throw new Error("Could not upload audio recording.");
  }
};

const uploadSegmentNative = async ({
  uri,
  meetingId,
  createSignedUrlForRecording,
}: Params) => {
  const fileInfo = await FileSystem.getInfoAsync(uri);

  if (!fileInfo.exists) {
    throw new Error("The file could not be found.");
  }

  const signedUrl = await createSignedUrlForRecording({
    meetingId: meetingId,
    platform: Platform.OS as "ios" | "android",
  });

  if (!signedUrl) {
    throw new Error("Could not get signed URL for recording.");
  }

  const uploadResponse = await FileSystem.uploadAsync(signedUrl, uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": "audio/m4a" },
  });

  if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
    throw new Error("Could not upload audio recording.");
  }
};

export function useUploadSegment() {
  const { mutateAsync: createSignedUrlForRecording } =
    trpc.v1.meeting.createSignedUrlForRecording.useMutation();

  const uploadSegment = Platform.select({
    web: uploadSegmentWeb,
    default: uploadSegmentNative,
  });

  return async (params: Omit<Params, "createSignedUrlForRecording">) => {
    return await uploadSegment({ ...params, createSignedUrlForRecording });
  };
}
