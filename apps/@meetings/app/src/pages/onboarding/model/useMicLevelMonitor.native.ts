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

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  AUDIO_LEVEL_INTERVAL_MS,
  dbToAudioLevel,
} from "~@meetings/app/features/recording";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";

import { MicErrorType } from "./types";

export function useMicLevelMonitor() {
  const audioRecorder = useAudioRecorder({
    ...RecordingPresets["HIGH_QUALITY"],
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(
    audioRecorder,
    AUDIO_LEVEL_INTERVAL_MS,
  );
  const [errorType, setErrorType] = useState<MicErrorType | null>(null);
  const hasRecordedRef = useRef(false);
  const { showSnackbar } = useSnackbar();

  const audioLevel = recorderState.isRecording
    ? dbToAudioLevel(recorderState.metering ?? -Infinity)
    : 0;

  const cleanupTempFile = useCallback(async () => {
    if (!hasRecordedRef.current) return;
    try {
      const uri = audioRecorder.uri;
      if (uri) {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      }
    } catch {
      // Android exposes a real fix (Settings > Apps > [app] > Storage >
      // Clear Cache removes exactly this kind of leftover file), so it's
      // worth telling the user. iOS has no equivalent per-app "clear cache"
      // action, so there's nothing actionable to surface there — the OS
      // will reclaim the cache space on its own regardless.
      if (Platform.OS === "android") {
        showSnackbar(
          "Couldn't clean up a temporary file. You can clear it anytime from your device's app storage settings.",
        );
      }
    }
  }, [audioRecorder, showSnackbar]);

  const stop = useCallback(async () => {
    if (audioRecorder.isRecording) {
      await audioRecorder.stop();
    }
    await cleanupTempFile();
  }, [audioRecorder, cleanupTempFile]);

  const start = useCallback(async () => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setErrorType("permission-denied");
      return;
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      hasRecordedRef.current = true;
      setErrorType(null);
    } catch {
      setErrorType("in-use");
    }
  }, [audioRecorder]);

  useEffect(() => {
    start();
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = useCallback(async () => {
    setErrorType(null);
    await start();
  }, [start]);

  return {
    audioLevel,
    errorType,
    retry,
  };
}
