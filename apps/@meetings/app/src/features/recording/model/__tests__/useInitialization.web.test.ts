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

import { renderHook, waitFor } from "@testing-library/react-native";

import { getBlobDurationMs } from "../../lib/getBlobDurationMs.web";
import { hasEBMLHeader } from "../../lib/hasEBMLHeader.web";
import { clearRecordedChunks, getAllChunks } from "../../lib/webRecorderDb.web";
import { useInitialization } from "../useInitialization.web";

jest.mock("idb", () => ({ openDB: jest.fn() }));
jest.mock("../../lib/getBlobDurationMs.web");
jest.mock("../../lib/hasEBMLHeader.web");
jest.mock("../../lib/webRecorderDb.web");
jest.mock("~@meetings/app/shared/api", () => ({
  useUploadSegment: () => mockUploadSegment,
}));

const MEETING_ID = "meeting-1";
const BLOB_URL = "blob:test-url";
const PERSISTED_DURATION_MS = 10_000;
const BLOB_DURATION_MS = 1234;

const mockUploadSegment = jest.fn().mockResolvedValue(undefined);

function buildParams(
  overrides: Partial<Parameters<typeof useInitialization>[0]> = {},
) {
  return {
    status: "idle" as const,
    hasHydrated: true,
    persistedDurationMs: PERSISTED_DURATION_MS,
    meetingId: MEETING_ID,
    setStatus: jest.fn(),
    setInitialDuration: jest.fn(),
    setPersistedDurationMs: jest.fn(),
    onError: jest.fn(),
    ...overrides,
  };
}

describe("useInitialization (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn().mockReturnValue(BLOB_URL);
    global.URL.revokeObjectURL = jest.fn();

    (getAllChunks as jest.Mock).mockResolvedValue([
      new Blob(["chunk"], { type: "audio/webm" }),
    ]);
    (clearRecordedChunks as jest.Mock).mockResolvedValue(undefined);
    (hasEBMLHeader as jest.Mock).mockResolvedValue(true);
    (getBlobDurationMs as jest.Mock).mockResolvedValue(BLOB_DURATION_MS);
  });

  it("does nothing until the store has hydrated", async () => {
    const params = buildParams({ hasHydrated: false });
    renderHook(() => useInitialization(params));

    await waitFor(() => expect(getAllChunks).not.toHaveBeenCalled());
    expect(params.setStatus).not.toHaveBeenCalled();
  });

  it("seeds the timer from persistedDurationMs when there are no pending chunks", async () => {
    (getAllChunks as jest.Mock).mockResolvedValue([]);
    const params = buildParams();

    renderHook(() => useInitialization(params));

    await waitFor(() =>
      expect(params.setInitialDuration).toHaveBeenCalledWith(
        PERSISTED_DURATION_MS,
      ),
    );
    expect(params.setPersistedDurationMs).toHaveBeenCalledWith(
      PERSISTED_DURATION_MS,
    );
    expect(mockUploadSegment).not.toHaveBeenCalled();
    expect(getBlobDurationMs).not.toHaveBeenCalled();
    expect(clearRecordedChunks).not.toHaveBeenCalled();
    expect(params.onError).not.toHaveBeenCalled();
  });

  it("uploads the segment when the blob is valid", async () => {
    const params = buildParams();
    renderHook(() => useInitialization(params));

    await waitFor(() => expect(mockUploadSegment).toHaveBeenCalled());

    expect(mockUploadSegment).toHaveBeenCalledWith(
      expect.objectContaining({ uri: BLOB_URL, meetingId: MEETING_ID }),
    );
    expect(params.setInitialDuration).toHaveBeenCalledWith(
      BLOB_DURATION_MS + PERSISTED_DURATION_MS,
    );
    expect(clearRecordedChunks).toHaveBeenCalled();
    expect(params.onError).not.toHaveBeenCalled();
  });

  it("still uploads the segment when decodeAudioData fails on an otherwise-valid blob", async () => {
    const decodeError = new Error("decodeAudioData timed out");
    (getBlobDurationMs as jest.Mock).mockRejectedValue(decodeError);
    const params = buildParams();

    renderHook(() => useInitialization(params));

    await waitFor(() => expect(params.onError).toHaveBeenCalled());

    // The upload already happened before the duration calculation.
    expect(mockUploadSegment).toHaveBeenCalledWith(
      expect.objectContaining({ uri: BLOB_URL, meetingId: MEETING_ID }),
    );
    expect(params.onError).toHaveBeenCalledWith(decodeError);
    // Chunks are cleared right after the upload succeeds, before duration is
    // computed.
    expect(clearRecordedChunks).toHaveBeenCalled();
  });

  it("errors without uploading when there is a blob but no meetingId", async () => {
    const params = buildParams({ meetingId: null });

    renderHook(() => useInitialization(params));

    await waitFor(() => expect(params.onError).toHaveBeenCalled());

    expect(mockUploadSegment).not.toHaveBeenCalled();
    expect(params.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Missing meetingId during recording initialization",
      }),
    );
  });

  it("still uploads and clears chunks when the header is invalid", async () => {
    (hasEBMLHeader as jest.Mock).mockResolvedValue(false);
    const params = buildParams();

    renderHook(() => useInitialization(params));

    await waitFor(() => expect(params.onError).toHaveBeenCalled());

    // The bytes still get uploaded and chunks cleared — this is the only
    // copy that can later be manually recovered, so a bad header shouldn't
    // block the attempt.
    expect(mockUploadSegment).toHaveBeenCalledWith(
      expect.objectContaining({ uri: BLOB_URL, meetingId: MEETING_ID }),
    );
    expect(clearRecordedChunks).toHaveBeenCalled();
    expect(params.onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("invalid WebM header"),
      }),
    );
  });

  it("falls back to paused status for any restored status other than idle/paused", async () => {
    const params = buildParams({ status: "recording" });

    renderHook(() => useInitialization(params));

    await waitFor(() => expect(mockUploadSegment).toHaveBeenCalled());
    await waitFor(() =>
      expect(params.setStatus).toHaveBeenLastCalledWith("paused"),
    );
  });

  it("only initializes once even if the hook re-renders", async () => {
    const params = buildParams();
    const { rerender } = renderHook((props) => useInitialization(props), {
      initialProps: params,
    });

    await waitFor(() => expect(mockUploadSegment).toHaveBeenCalledTimes(1));

    rerender(buildParams());

    expect(getAllChunks).toHaveBeenCalledTimes(1);
  });
});
