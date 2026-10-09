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

import * as Sentry from "@sentry/react-native";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";

import { NewRecordingProvider, useNewRecording } from "../RecordingProvider";

const mockStart = jest.fn().mockResolvedValue(undefined);
const mockStop = jest.fn().mockResolvedValue(undefined);
const mockGetUrl = jest.fn().mockResolvedValue("file://recording.m4a");
const mockDiscard = jest.fn().mockResolvedValue(undefined);
const mockPause = jest.fn();
const mockResume = jest.fn();
const mockTogglePauseResume = jest.fn();

jest.mock("../useRecorder", () => ({
  useRecorder: () => ({
    start: mockStart,
    stop: mockStop,
    getUrl: mockGetUrl,
    discard: mockDiscard,
    pause: mockPause,
    resume: mockResume,
    togglePauseResume: mockTogglePauseResume,
    state: "idle",
    audioLevel: 0,
    durationMs: 0,
  }),
}));

jest.mock("@sentry/react-native", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  captureException: jest.fn(),
}));

const mockShowSnackbar = jest.fn();
jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar, isShowing: false }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <NewRecordingProvider>{children}</NewRecordingProvider>;
}

describe("NewRecordingProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("provides correct initial values", () => {
    const { result } = renderHook(() => useNewRecording(), { wrapper });

    expect(result.current.state).toBe("idle");
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.durationMs).toBe(0);
  });

  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useNewRecording());
    }).toThrow("useNewRecording must be used within <NewRecordingProvider>");
  });

  describe("startRecording", () => {
    it("calls recorder.start and logs to Sentry", async () => {
      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockStart).toHaveBeenCalled();
      expect(Sentry.logger.info).toHaveBeenCalledWith("recording.start");
    });

    it("shows specific mic error message when start fails with NotAllowedError", async () => {
      const err = new DOMException("Permission denied", "NotAllowedError");
      mockStart.mockRejectedValueOnce(err);

      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining("Microphone access required"),
        6000,
      );
      expect(Sentry.logger.error).toHaveBeenCalledWith(
        "recording.start.error",
        expect.objectContaining({ micError: "permission-denied" }),
      );
      expect(Sentry.captureException).toHaveBeenCalledWith(err);
    });

    it("shows in-use message for NotReadableError", async () => {
      const err = new DOMException("Device in use", "NotReadableError");
      mockStart.mockRejectedValueOnce(err);

      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining("Microphone is unavailable"),
        6000,
      );
      expect(Sentry.logger.error).toHaveBeenCalledWith(
        "recording.start.error",
        expect.objectContaining({ micError: "in-use" }),
      );
    });

    it("shows not-found message for NotFoundError", async () => {
      const err = new DOMException("No mic", "NotFoundError");
      mockStart.mockRejectedValueOnce(err);

      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining("Microphone not detected"),
        6000,
      );
      expect(Sentry.logger.error).toHaveBeenCalledWith(
        "recording.start.error",
        expect.objectContaining({ micError: "not-found" }),
      );
    });

    it("treats non-DOMException errors as permission-denied", async () => {
      mockStart.mockRejectedValueOnce(new Error("generic failure"));

      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockShowSnackbar).toHaveBeenCalledWith(
        expect.stringContaining("Microphone access required"),
        6000,
      );
    });
  });

  describe("pauseRecording", () => {
    it("calls recorder.pause and logs to Sentry", () => {
      const { result } = renderHook(() => useNewRecording(), { wrapper });

      act(() => {
        result.current.pauseRecording();
      });

      expect(mockPause).toHaveBeenCalled();
      expect(Sentry.logger.info).toHaveBeenCalledWith("recording.pause");
    });
  });

  describe("resumeRecording", () => {
    it("calls recorder.resume and logs to Sentry", () => {
      const { result } = renderHook(() => useNewRecording(), { wrapper });

      act(() => {
        result.current.resumeRecording();
      });

      expect(mockResume).toHaveBeenCalled();
      expect(Sentry.logger.info).toHaveBeenCalledWith("recording.resume");
    });
  });

  describe("finalizeRecording", () => {
    it("stops the recorder, returns its URL, and logs", async () => {
      const { result } = renderHook(() => useNewRecording(), { wrapper });

      let url: string | null = null;
      await act(async () => {
        url = await result.current.finalizeRecording();
      });

      expect(mockStop).toHaveBeenCalled();
      expect(url).toBe("file://recording.m4a");
      expect(Sentry.logger.info).toHaveBeenCalledWith("recording.finalized");
    });

    it("throws and shows a snackbar when the recorder has no URL", async () => {
      mockGetUrl.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await expect(result.current.finalizeRecording()).rejects.toThrow(
          "No URL provided when finalizing recording",
        );
      });

      expect(Sentry.logger.error).toHaveBeenCalledWith(
        "recording.finalized.exception",
      );
      expect(Sentry.captureException).toHaveBeenCalled();
      expect(mockShowSnackbar).toHaveBeenCalledWith("A fatal error occured.");
    });
  });

  describe("discardRecording", () => {
    it("calls recorder.discard", async () => {
      const { result } = renderHook(() => useNewRecording(), { wrapper });

      await act(async () => {
        await result.current.finalizeRecording();
      });

      await act(async () => {
        await result.current.discardRecording();
      });

      expect(mockDiscard).toHaveBeenCalled();
    });
  });
});
