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
import { AudioModule } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { Alert, Platform } from "react-native";

import { MAX_RECORDING_MS } from "../../config";
import { configureAudioMode } from "../../lib/audioMode";
import { useRecorder } from "../useRecorder.native";

const mockRecorder = {
  prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
  record: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  uri: "file://recording.mp4" as string | null,
};

let mockRecorderState = {
  isRecording: false,
  canRecord: false,
  metering: undefined as number | undefined,
};

jest.mock("expo-audio", () => ({
  AudioModule: { requestRecordingPermissionsAsync: jest.fn() },
  RecordingPresets: { HIGH_QUALITY: {} },
  useAudioRecorder: () => mockRecorder,
  useAudioRecorderState: () => mockRecorderState,
}));

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../lib/audioMode", () => ({
  configureAudioMode: jest.fn(),
}));

const mockShowSnackbar = jest.fn();
jest.mock("~@meetings/app/shared/ui/Snackbar", () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

const requestPermissions = jest.mocked(
  AudioModule.requestRecordingPermissionsAsync,
);

// expo-audio drives the recorder state through useAudioRecorderState, so
// tests simulate native updates by swapping the polled state and rerendering.
function setNativeState(
  hook: { rerender: (props: unknown) => void },
  state: Partial<typeof mockRecorderState>,
) {
  mockRecorderState = { ...mockRecorderState, ...state };
  hook.rerender({});
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("useRecorder (native)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockRecorder.uri = "file://recording.mp4";
    mockRecorderState = {
      isRecording: false,
      canRecord: false,
      metering: -Infinity,
    };
    requestPermissions.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Awaited<ReturnType<typeof requestPermissions>>);
    jest.mocked(configureAudioMode).mockResolvedValue({
      allowsBackgroundRecording: true,
    } as Awaited<ReturnType<typeof configureAudioMode>>);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts idle with no audio level or duration", () => {
    const { result } = renderHook(() => useRecorder());

    expect(result.current.state).toBe("idle");
    expect(result.current.audioLevel).toBe(0);
    expect(result.current.durationMs).toBe(0);
  });

  describe("start", () => {
    it("prepares and records up to the max duration", async () => {
      const { result } = renderHook(() => useRecorder());

      await act(() => result.current.start());

      expect(mockRecorder.prepareToRecordAsync).toHaveBeenCalled();
      expect(mockRecorder.record).toHaveBeenCalledWith({
        forDuration: MAX_RECORDING_MS / 1000,
      });
    });

    it("throws without recording when permission is denied", async () => {
      requestPermissions.mockResolvedValue({
        granted: false,
        canAskAgain: true,
      } as Awaited<ReturnType<typeof requestPermissions>>);
      const alertSpy = jest.spyOn(Alert, "alert");
      const { result } = renderHook(() => useRecorder());

      await expect(result.current.start()).rejects.toThrow(
        "Microphone permission not granted",
      );
      expect(mockRecorder.record).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it("points the user to Settings when permission is permanently denied", async () => {
      requestPermissions.mockResolvedValue({
        granted: false,
        canAskAgain: false,
      } as Awaited<ReturnType<typeof requestPermissions>>);
      const alertSpy = jest.spyOn(Alert, "alert");
      const { result } = renderHook(() => useRecorder());

      await expect(result.current.start()).rejects.toThrow();
      expect(alertSpy).toHaveBeenCalledWith(
        "Permission to access microphone was denied",
        expect.any(String),
        expect.any(Array),
      );
    });

    it("warns once on Android when background recording is unavailable", async () => {
      jest.replaceProperty(Platform, "OS", "android");
      jest.mocked(configureAudioMode).mockResolvedValue({
        allowsBackgroundRecording: false,
      } as Awaited<ReturnType<typeof configureAudioMode>>);
      const { result } = renderHook(() => useRecorder());

      await act(() => result.current.start());
      await act(() => result.current.start());

      expect(mockShowSnackbar).toHaveBeenCalledTimes(1);
    });

    it("configures the audio mode for background recording on iOS", async () => {
      jest.replaceProperty(Platform, "OS", "ios");
      const { result } = renderHook(() => useRecorder());

      await act(() => result.current.start());

      expect(configureAudioMode).toHaveBeenCalledTimes(1);
      expect(mockShowSnackbar).not.toHaveBeenCalled();
    });
  });

  describe("state from the native recorder", () => {
    it("maps isRecording and canRecord to recording, paused, and idle", () => {
      const hook = renderHook(() => useRecorder());

      setNativeState(hook, { isRecording: true, canRecord: true });
      expect(hook.result.current.state).toBe("recording");

      setNativeState(hook, { isRecording: false, canRecord: true });
      expect(hook.result.current.state).toBe("paused");

      setNativeState(hook, { isRecording: false, canRecord: false });
      expect(hook.result.current.state).toBe("idle");
    });

    it("reports audio level only while recording", () => {
      const hook = renderHook(() => useRecorder());

      setNativeState(hook, { isRecording: true, metering: -25 });
      expect(hook.result.current.audioLevel).toBe(1);

      setNativeState(hook, { isRecording: false, canRecord: true });
      expect(hook.result.current.audioLevel).toBe(0);
    });

    it("does not count paused time toward durationMs", () => {
      const hook = renderHook(() => useRecorder());

      setNativeState(hook, { isRecording: true, canRecord: true });
      advance(1000);
      setNativeState(hook, { isRecording: false });
      advance(5000);
      expect(hook.result.current.durationMs).toBe(1000);

      setNativeState(hook, { isRecording: true });
      advance(500);
      expect(hook.result.current.durationMs).toBe(1500);
    });
  });

  it("pause and resume delegate to the native recorder", () => {
    const { result } = renderHook(() => useRecorder());

    act(() => result.current.pause());
    expect(mockRecorder.pause).toHaveBeenCalled();

    act(() => result.current.resume());
    expect(mockRecorder.record).toHaveBeenCalledWith({
      forDuration: MAX_RECORDING_MS / 1000,
    });
  });

  it("stop stops the recorder and freezes the duration", async () => {
    const hook = renderHook(() => useRecorder());
    setNativeState(hook, { isRecording: true, canRecord: true });
    advance(2000);

    await act(() => hook.result.current.stop());
    advance(2000);

    expect(mockRecorder.stop).toHaveBeenCalled();
    expect(hook.result.current.durationMs).toBe(2000);
  });

  it("getUrl returns the recorder's file URI", () => {
    const { result } = renderHook(() => useRecorder());
    expect(result.current.getUrl()).toBe("file://recording.mp4");

    mockRecorder.uri = null;
    expect(result.current.getUrl()).toBeNull();
  });

  describe("discard", () => {
    it("stops the recorder and deletes the recorded file", async () => {
      jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
        exists: true,
      } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>);
      const { result } = renderHook(() => useRecorder());

      await act(() => result.current.discard());

      expect(mockRecorder.stop).toHaveBeenCalled();
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        "file://recording.mp4",
        { idempotent: true },
      );
    });

    it("skips deletion when the file does not exist", async () => {
      jest.mocked(FileSystem.getInfoAsync).mockResolvedValue({
        exists: false,
      } as Awaited<ReturnType<typeof FileSystem.getInfoAsync>>);
      const { result } = renderHook(() => useRecorder());

      await act(() => result.current.discard());

      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it("skips the file check when there is no URI", async () => {
      mockRecorder.uri = null;
      const { result } = renderHook(() => useRecorder());

      await act(() => result.current.discard());

      expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
    });
  });
});
