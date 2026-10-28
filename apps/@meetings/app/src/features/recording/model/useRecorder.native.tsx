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
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";

import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";

import {
  AUDIO_LEVEL_INTERVAL_MS,
  MAX_RECORDING_MS,
  MAX_RECORDING_SEC,
} from "../config";
import { dbToAudioLevel } from "../lib/audioLevel";
import { configureAudioMode } from "../lib/audioMode";
import { RecorderState } from "./recorderStates";
import { AudioRecorder, AudioRecorderProps } from "./types";

type RecorderFinish = null | "user" | "timeExpired";

export function useRecorder(props: AudioRecorderProps = {}): AudioRecorder {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const allowsBackgroundRecordingRef = useRef(false);
  const hasWarnedBackgroundRef = useRef(false);
  const { showSnackbar } = useSnackbar();
  const config = props?.config;
  // Used to track when the recording has been killed by "forDuration",
  // useful for catching in-background stops
  const finishTypeRef = useRef<RecorderFinish>(null);

  const audioRecorder = useAudioRecorder(
    {
      ...RecordingPresets.HIGH_QUALITY,
      // force mono so we don't lose DB squashing down to mono later
      numberOfChannels: 1,
      isMeteringEnabled: true,
      // we do MP4 here just to have parity with the web's MediaBunny recorder implementation
      extension: ".mp4",
    },
    function onRecordingTerminated(status) {
      // This checks to see if this happened because "forDuration" reached its limit
      if (status.isFinished && !finishTypeRef.current) {
        config?.onDurationLimitReached?.();
        finishTypeRef.current = "timeExpired";
      }
    },
  );

  const audioRecorderState = useAudioRecorderState(
    audioRecorder,
    AUDIO_LEVEL_INTERVAL_MS,
  );

  const audioLevel = audioRecorderState.isRecording
    ? dbToAudioLevel(audioRecorderState.metering ?? -Infinity)
    : 0;

  useEffect(
    function onRecStateChange() {
      if (audioRecorderState.isRecording) {
        setRecorderState("recording");
        return;
      }

      if (audioRecorderState.canRecord) {
        setRecorderState("paused");
        return;
      }

      setRecorderState("idle");
    },
    [audioRecorderState],
  );

  const start = async (): Promise<void> => {
    finishTypeRef.current = null;
    await handleRecordingPermissions();

    await audioRecorder.prepareToRecordAsync();
    // Leveraging "forDuration" allows us to adhere to the maximum recording
    // timer even when the app is backgrounded
    audioRecorder.record({ forDuration: MAX_RECORDING_SEC });
  };

  const handleRecordingPermissions = async (): Promise<void> => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          "Permission to access microphone was denied",
          "Please enable microphone access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
      throw new Error("Microphone permission not granted");
    }

    if (!allowsBackgroundRecordingRef.current) {
      const { allowsBackgroundRecording } = await configureAudioMode();
      allowsBackgroundRecordingRef.current = allowsBackgroundRecording;

      if (!allowsBackgroundRecording && !hasWarnedBackgroundRef.current) {
        hasWarnedBackgroundRef.current = true;
        showSnackbar(
          "Notifications are turned off, so this recording will stop if you leave the app. Enable notifications in Settings to keep recording in the background.",
          6000,
        );
      }
    }
  };

  const stop = async (): Promise<void> => {
    finishTypeRef.current = "user";
    await audioRecorder.stop();
  };

  const getUrl = (): string | null => {
    return audioRecorder?.uri ?? null;
  };

  const resume = () => {
    // Calculate how much time till the max duration is reached
    // FROM the already-recorded audio
    const timeRemainingSec =
      MAX_RECORDING_SEC - audioRecorderState?.durationMillis / 1000;
    audioRecorder.record({ forDuration: timeRemainingSec });
  };

  const pause = () => {
    /*
     * AVild - This makes me feel nothing but pain.
     * Basically, expo-audio doesn't cancel its duration timer
     * on pause but briefly calling record w/ no params circumvents that
     *
     * Without this hack, a paused meeting can still hit the max-duration
     * even though It's not recording.
     */
    audioRecorder.pause();
    audioRecorder.record();
    audioRecorder.pause();
  };

  const discard = async () => {
    finishTypeRef.current = "user";
    await audioRecorder.stop();

    const uri = audioRecorder.uri;
    if (uri) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  };

  const durationMs =
    finishTypeRef.current === "timeExpired"
      ? MAX_RECORDING_MS
      : audioRecorderState?.durationMillis;

  return {
    start,
    stop,
    getUrl,
    discard,
    pause,
    resume,
    state: recorderState,
    audioLevel,
    durationMs,
  };
}
