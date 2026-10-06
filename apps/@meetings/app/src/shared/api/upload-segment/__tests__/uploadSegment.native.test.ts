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

import { uploadSegment } from "../uploadSegment.native";

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
  createUploadTask: jest.fn(),
  FileSystemUploadType: { BINARY_CONTENT: 0 },
}));

const EXPIRED_TOKEN_BODY =
  "<?xml version='1.0' encoding='UTF-8'?><Error><Code>ExpiredToken</Code><Message>Invalid argument.</Message><Details>The provided token has expired. Request signature expired at: 2026-10-01T14:58:21+00:00</Details></Error>";

const ACCESS_DENIED_BODY =
  "<?xml version='1.0' encoding='UTF-8'?><Error><Code>AccessDenied</Code><Message>Access denied.</Message></Error>";

function mockUploadResponses(
  ...responses: Array<{ status: number; body: string }>
) {
  const uploadAsync = jest.fn();
  for (const response of responses) {
    uploadAsync.mockResolvedValueOnce({ headers: {}, ...response });
  }
  (FileSystem.createUploadTask as jest.Mock).mockReturnValue({
    uploadAsync,
    cancelAsync: jest.fn(),
  });
}

describe("uploadSegment (native)", () => {
  const createSignedUrlForRecording = jest.fn();

  const upload = () =>
    uploadSegment({
      uri: "file:///recording.m4a",
      meetingId: "meeting-1",
      contentType: "audio/m4a",
      fileExtension: "m4a",
      createSignedUrlForRecording,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
    createSignedUrlForRecording
      .mockResolvedValueOnce("https://storage.example/first-url")
      .mockResolvedValueOnce("https://storage.example/second-url");
  });

  // MEETINGS-APP-171: a backgrounded app can send the PUT after its signed
  // URL has expired.
  it("retries once with a freshly signed URL when the URL has expired", async () => {
    mockUploadResponses(
      { status: 400, body: EXPIRED_TOKEN_BODY },
      { status: 200, body: "" },
    );

    await expect(upload()).resolves.toBeUndefined();

    expect(createSignedUrlForRecording).toHaveBeenCalledTimes(2);
    expect(FileSystem.createUploadTask).toHaveBeenLastCalledWith(
      "https://storage.example/second-url",
      "file:///recording.m4a",
      expect.anything(),
      expect.any(Function),
    );
  });

  it("throws when the retried upload also fails", async () => {
    mockUploadResponses(
      { status: 400, body: EXPIRED_TOKEN_BODY },
      { status: 400, body: EXPIRED_TOKEN_BODY },
    );

    await expect(upload()).rejects.toThrow("ExpiredToken");
    expect(createSignedUrlForRecording).toHaveBeenCalledTimes(2);
  });

  it("does not retry other upload errors", async () => {
    mockUploadResponses({ status: 403, body: ACCESS_DENIED_BODY });

    await expect(upload()).rejects.toThrow("AccessDenied");
    expect(createSignedUrlForRecording).toHaveBeenCalledTimes(1);
  });
});
