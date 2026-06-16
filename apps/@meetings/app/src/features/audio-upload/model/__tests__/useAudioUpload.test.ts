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

import { act, renderHook } from "@testing-library/react-native";

import {
  useCreateMeeting,
  useDiscardMeeting,
  useEndMeeting,
} from "~@meetings/app/entities/meeting";
import { AbortError } from "~@meetings/app/shared/lib/errors";

import { trpc, useUploadSegment } from "../../../../shared/api";
import { useAudioUploadStore } from "../store";
import { RawFileInfo } from "../types";
import { useAudioUpload } from "../useAudioUpload";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("~@meetings/app/shared/api/upload-segment");
jest.mock("~@meetings/app/entities/meeting/model/useCreateMeeting");
jest.mock("~@meetings/app/entities/meeting/model/useEndMeeting");
jest.mock("~@meetings/app/entities/meeting/model/useDiscardMeeting");
jest.mock("~@meetings/app/shared/api/trpc", () => ({
  __esModule: true,
  trpc: {
    v1: {
      meeting: {
        deleteRecordings: { useMutation: jest.fn() },
      },
    },
  },
}));
jest.mock("../store");

const mockUploadSegment = jest.fn();
const mockCreateMeetingAsync = jest.fn();
const mockEndMeeting = jest.fn();
const mockDiscardMeeting = jest.fn();
const mockDeleteRecordings = jest.fn();

const mockSetError = jest.fn();
const mockSetFile = jest.fn();
const mockSetStatus = jest.fn();
const mockSetDialog = jest.fn();
const mockSetUploadProgress = jest.fn();
const mockSetMeetingId = jest.fn();
const mockSetRecordingDate = jest.fn();
const mockSetRecordingTime = jest.fn();
const mockReset = jest.fn();

const FAKE_RECORDING_DATE = new Date("2025-10-19");
const FAKE_RECORDING_TIME = new Date("2025-10-19T14:30:00");

const MEETING_ID = "meeting-123";
const PERSON_ID = BigInt(456);
const PERSON_TYPE = "client" as const;

const validRawFile: RawFileInfo = {
  uri: "file:///test/audio.m4a",
  name: "audio.m4a",
  mimeType: "audio/m4a",
  size: 1024,
};

function mockStoreWith(overrides: Record<string, unknown> = {}) {
  const storeState = {
    status: "selecting",
    dialog: null,
    meetingId: MEETING_ID,
    person: { personId: PERSON_ID },
    personType: PERSON_TYPE,
    file: null,
    error: null,
    setError: mockSetError,
    setFile: mockSetFile,
    setStatus: mockSetStatus,
    setDialog: mockSetDialog,
    setUploadProgress: mockSetUploadProgress,
    setMeetingId: mockSetMeetingId,
    setRecordingDate: mockSetRecordingDate,
    setRecordingTime: mockSetRecordingTime,
    recordingDate: FAKE_RECORDING_DATE,
    recordingTime: FAKE_RECORDING_TIME,
    reset: mockReset,
    ...overrides,
  };
  (useAudioUploadStore as unknown as jest.Mock).mockImplementation(
    (selector?: (s: typeof storeState) => unknown) =>
      selector ? selector(storeState) : storeState,
  );
}

beforeEach(() => {
  jest.clearAllMocks();

  mockStoreWith();

  (useUploadSegment as jest.Mock).mockReturnValue(mockUploadSegment);
  (useCreateMeeting as jest.Mock).mockReturnValue({
    createMeetingAsync: mockCreateMeetingAsync,
  });
  (useEndMeeting as jest.Mock).mockReturnValue({
    mutateAsync: mockEndMeeting,
  });
  (useDiscardMeeting as jest.Mock).mockReturnValue({
    mutateAsync: mockDiscardMeeting,
  });
  (trpc.v1.meeting.deleteRecordings.useMutation as jest.Mock).mockReturnValue({
    mutateAsync: mockDeleteRecordings,
  });

  mockUploadSegment.mockResolvedValue(undefined);
  mockEndMeeting.mockResolvedValue(undefined);
  mockDiscardMeeting.mockResolvedValue(undefined);
  mockDeleteRecordings.mockResolvedValue(undefined);
});

describe("useAudioUpload", () => {
  describe("addFile", () => {
    it("uploads a valid file and sets status to uploaded", async () => {
      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockCreateMeetingAsync).not.toHaveBeenCalled();
      expect(mockDeleteRecordings).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
      });
      expect(mockSetError).toHaveBeenCalledWith(null);
      expect(mockSetFile).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: validRawFile.uri,
          name: validRawFile.name,
          size: validRawFile.size,
        }),
      );
      expect(mockSetStatus).toHaveBeenCalledWith("uploading");
      expect(mockSetUploadProgress).toHaveBeenCalledWith(0, validRawFile.size);
      expect(mockUploadSegment).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: validRawFile.uri,
          meetingId: MEETING_ID,
          signal: expect.any(AbortSignal),
          onProgress: expect.any(Function),
        }),
      );
      expect(mockSetStatus).toHaveBeenCalledWith("uploaded");
    });

    it("calls onProgress callback during upload", async () => {
      mockUploadSegment.mockImplementation(async ({ onProgress }) => {
        onProgress(512, 1024);
      });

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockSetUploadProgress).toHaveBeenCalledWith(512, 1024);
    });

    it("creates a meeting when meetingId is null", async () => {
      const newMeetingId = "new-meeting-id";
      mockCreateMeetingAsync.mockResolvedValue(newMeetingId);
      mockStoreWith({ meetingId: null });

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockCreateMeetingAsync).toHaveBeenCalled();
      expect(mockDeleteRecordings).not.toHaveBeenCalled();
      expect(mockSetMeetingId).toHaveBeenCalledWith(newMeetingId);
      expect(mockUploadSegment).toHaveBeenCalledWith(
        expect.objectContaining({ meetingId: newMeetingId }),
      );
      expect(mockSetStatus).toHaveBeenCalledWith("uploaded");
    });

    it("sets error when meetingId and person are null", async () => {
      mockStoreWith({ meetingId: null, person: null });

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockUploadSegment).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith(
        "person and personType are required",
      );
      expect(mockSetStatus).toHaveBeenCalledWith("selecting");
    });

    it("clears file and reverts to selecting on AbortError", async () => {
      mockUploadSegment.mockRejectedValue(new AbortError());

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockSetError).not.toHaveBeenCalledWith(expect.any(String));
      expect(mockSetFile).toHaveBeenCalledWith(null);
      expect(mockSetUploadProgress).toHaveBeenCalledWith(0, 0);
      expect(mockSetStatus).toHaveBeenCalledWith("selecting");
    });

    it("sets error on FileValidationError", async () => {
      const rawFile: RawFileInfo = {
        uri: "file:///test/audio.txt",
        name: "audio.txt",
        mimeType: "text/plain",
        size: 1024,
      };

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(rawFile);
      });

      expect(mockSetError).toHaveBeenCalledWith("Unsupported file type");
      expect(mockSetStatus).toHaveBeenCalledWith("selecting");
      expect(mockUploadSegment).not.toHaveBeenCalled();
    });

    it("sets error and reverts to selecting when deleteRecordings fails", async () => {
      mockDeleteRecordings.mockRejectedValue(new Error("Storage error"));

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockUploadSegment).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith("Storage error");
      expect(mockSetStatus).toHaveBeenCalledWith("selecting");
    });

    it("sets error and reverts to selecting on generic upload error", async () => {
      mockUploadSegment.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.addFile(validRawFile);
      });

      expect(mockSetError).toHaveBeenCalledWith("Network error");
      expect(mockSetStatus).toHaveBeenCalledWith("selecting");
    });
  });

  describe("removeFile", () => {
    it("clears file state and reverts to selecting", async () => {
      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.removeFile();
      });

      expect(mockDeleteRecordings).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
      });
      expect(mockSetFile).toHaveBeenCalledWith(null);
      expect(mockSetUploadProgress).toHaveBeenCalledWith(0, 0);
      expect(mockSetStatus).toHaveBeenCalledWith("selecting");
    });

    it("aborts in-progress upload before removing", async () => {
      let abortSignal: AbortSignal | undefined;
      mockUploadSegment.mockImplementation(
        async ({ signal }: { signal: AbortSignal }) => {
          abortSignal = signal;
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return new Promise(() => {});
        },
      );

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        result.current.addFile(validRawFile);
        await Promise.resolve();
      });

      act(() => {
        result.current.removeFile();
      });

      expect(abortSignal?.aborted).toBe(true);
      expect(mockSetFile).toHaveBeenCalledWith(null);
    });

    it("sets error when meetingId is null", () => {
      mockStoreWith({ meetingId: null });

      const { result } = renderHook(() => useAudioUpload());

      act(() => {
        result.current.removeFile();
      });

      expect(mockSetFile).not.toHaveBeenCalled();
      expect(mockSetError).toHaveBeenCalledWith("meetingId is required");
    });
  });

  describe("confirmUpload", () => {
    it("calls endMeeting and sets dialog to success", async () => {
      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.confirmUpload();
      });

      expect(mockEndMeeting).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: PERSON_TYPE,
        startTime: expect.any(Date),
      });
      expect(mockSetDialog).toHaveBeenCalledWith("success");
    });

    it("sets error dialog on failure", async () => {
      mockEndMeeting.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.confirmUpload();
      });

      expect(mockSetDialog).toHaveBeenCalledWith("error");
    });

    it("throws when meetingId or personId is null", async () => {
      mockStoreWith({ meetingId: null, person: null });

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.confirmUpload();
      });

      expect(mockEndMeeting).not.toHaveBeenCalled();
      expect(mockSetDialog).toHaveBeenCalledWith("error");
    });
  });

  describe("discardUpload", () => {
    it("calls discardMeeting and resets store", async () => {
      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.discardUpload();
      });

      expect(mockDeleteRecordings).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
      });
      expect(mockDiscardMeeting).toHaveBeenCalledWith({
        meetingId: MEETING_ID,
        personId: PERSON_ID,
        personType: PERSON_TYPE,
      });
      expect(mockReset).toHaveBeenCalled();
    });

    it("aborts in-progress upload before discarding", async () => {
      let abortSignal: AbortSignal | undefined;
      mockUploadSegment.mockImplementation(
        async ({ signal }: { signal: AbortSignal }) => {
          abortSignal = signal;
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return new Promise(() => {});
        },
      );

      const { result } = renderHook(() => useAudioUpload());

      // Start upload — await so deleteRecordings resolves and uploadSegment begins
      await act(async () => {
        result.current.addFile(validRawFile);
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.discardUpload();
      });

      expect(abortSignal?.aborted).toBe(true);
      expect(mockDiscardMeeting).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();
    });

    it("throws when meetingId or personId is null", async () => {
      mockStoreWith({ meetingId: null, person: null });
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useAudioUpload());

      await act(async () => {
        await result.current.discardUpload();
      });

      expect(mockDiscardMeeting).not.toHaveBeenCalled();
      expect(mockReset).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("continueUpload", () => {
    it("dismisses the dialog without changing status", () => {
      const { result } = renderHook(() => useAudioUpload());

      act(() => {
        result.current.continueUpload();
      });

      expect(mockSetDialog).toHaveBeenCalledWith(null);
      expect(mockSetStatus).not.toHaveBeenCalled();
    });
  });

  describe("requestCancel", () => {
    it("sets dialog to cancel", () => {
      const { result } = renderHook(() => useAudioUpload());

      act(() => {
        result.current.requestCancel();
      });

      expect(mockSetDialog).toHaveBeenCalledWith("cancel");
    });
  });

  describe("closeModal", () => {
    it("resets the store", () => {
      const { result } = renderHook(() => useAudioUpload());

      act(() => {
        result.current.closeModal();
      });

      expect(mockReset).toHaveBeenCalled();
    });
  });
});
