// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useAudioRecorderState } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";

import { RecordingStatus } from "../common/types";
import { useRecording } from "../context/RecordingContext";
import { trpc } from "../trpc/client";
import {
  requestNotificationPermissions,
  sendNotification,
} from "../utils/notifications";
import { getItem, removeItem } from "../utils/storage";

interface Person {
  personId: bigint;
  fullName: string;
  displayPersonExternalId: string;
  primaryMetadata: string;
}

interface UseMeetingRecordingParams {
  person: Person;
  meetingId: string;
  onComplete: () => void;
}

interface UseMeetingRecordingReturn {
  status: RecordingStatus;
  note: string;
  setNote: (note: string) => void;
  recorderState: ReturnType<typeof useAudioRecorderState>;
  totalDurationMs: number;
  actions: {
    startRecording: () => Promise<void>;
    handleTogglePauseResume: () => Promise<void>;
    stopRecording: () => void;
    handleFinishAndSave: () => Promise<void>;
    handleDiscard: () => void;
    handleFinalDiscard: () => Promise<void>;
    handleContinue: () => void;
  };
}

export const useMeetingRecording = ({
  person,
  meetingId,
  onComplete,
}: UseMeetingRecordingParams): UseMeetingRecordingReturn => {
  const [note, setNote] = useState("");
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [accumulatedDurationMs, setAccumulatedDurationMs] = useState(0);

  const {
    status,
    setStatus,
    audioRecorder,
    recorderState,
    startRecording,
    stopRecording,
    stopAndUploadRecording,
    togglePauseResume: contextTogglePauseResume,
    initializeRecording,
    cleanupRecording,
  } = useRecording();

  const prevRecorderStateRef = useRef(recorderState.isRecording);
  useEffect(() => {
    (async () => {
      await initializeRecording();
      const saved = await getItem("note");
      setNote(saved);
      requestNotificationPermissions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endMeetingMutation = trpc.v1.meeting.endMeeting.useMutation({
    onSuccess: () => {
      console.log("Meeting successfully ended and processing started");
    },
    onError: (err) => {
      console.error("[endMeeting] Failed:", err);
    },
  });

  const updateNotesMutation = trpc.v1.meeting.updateNotes.useMutation({
    onSuccess: () => {
      console.log("Notes updated successfully on server");
    },
    onError: (err) => {
      console.error("[updateNotes] Failed:", err);
    },
  });

  const discardMeetingMutation = trpc.v1.meeting.discardMeeting.useMutation({
    onSuccess: () => {
      console.log("Meeting discarded successfully");
    },
    onError: (err) => {
      console.error("[discardMeeting] Failed:", err);
      Alert.alert("Error", "Failed to discard meeting. Please try again.");
    },
  });

  const { refetch } = trpc.v1.meeting.getSignedUrlForRecording.useQuery(
    { clientId: person.personId, meetingId: meetingId ?? "" },
    { enabled: false },
  );

  const uploadSegmentToGCS = useCallback(
    async (uri: string) => {
      setAccumulatedDurationMs(
        accumulatedDurationMs + recorderState.durationMillis,
      );

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        if (!response.url) {
          console.warn("File does not exist:", uri);
          return;
        }
      } else {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          console.warn("File does not exist:", uri);
          return;
        }
      }

      const { data: signedUrl } = await refetch();
      if (!signedUrl) return;

      try {
        if (Platform.OS === "web") {
          const response = await fetch(uri);
          const blob = await response.blob();
          await fetch(signedUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": "audio/m4a" },
          });
        } else {
          await FileSystem.uploadAsync(signedUrl, uri, {
            httpMethod: "PUT",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: { "Content-Type": "audio/m4a" },
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      }
    },
    [refetch, accumulatedDurationMs, recorderState.durationMillis],
  );

  const handleTogglePauseResume = async () => {
    await contextTogglePauseResume(uploadSegmentToGCS);

    // Update notes after pausing
    if (status === "recording") {
      try {
        await updateNotesMutation.mutateAsync({
          clientId: person.personId,
          meetingId,
          notes: note,
        });
      } catch (err) {
        console.error("Failed to update notes:", err);
      }
    }
  };

  const handleFinishAndSave = async () => {
    setStatus("ending");

    try {
      if (recorderState.isRecording) {
        await stopAndUploadRecording(uploadSegmentToGCS);
      }

      await removeItem("note");

      await endMeetingMutation.mutateAsync({
        clientId: person.personId,
        meetingId,
        notes: note,
      });

      await cleanupRecording();
      onComplete();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  };

  const handleContinue = () => setStatus("recording");
  const handleDiscard = () => setStatus("discarding");

  const handleFinalDiscard = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
    }
    await cleanupRecording();

    await discardMeetingMutation.mutateAsync({
      clientId: person.personId,
      meetingId,
    });

    onComplete();
  };

  const handleAutoStopRecording = useCallback(async () => {
    setStatus("uploading");
    await stopAndUploadRecording(uploadSegmentToGCS);
    setStatus("paused");

    sendNotification(
      "Recording Paused",
      "90 minute-at-a-time recording limit reached. Pausing Recording",
    );
  }, [setStatus, stopAndUploadRecording, uploadSegmentToGCS]);

  // Auto-stop recording when limit is reached
  useEffect(() => {
    //introduced to keep track of previous recorder state to prevent initial triggering of the handleAutoStopRecording function
    const prevIsRecording = prevRecorderStateRef.current;
    if (
      status === "recording" &&
      prevIsRecording &&
      !recorderState.isRecording
    ) {
      handleAutoStopRecording();
    }

    prevRecorderStateRef.current = recorderState.isRecording;
  }, [status, recorderState.isRecording, handleAutoStopRecording]);

  useEffect(() => {
    if (status === "recording") {
      setTotalDurationMs(accumulatedDurationMs + recorderState.durationMillis);
    }
  }, [status, recorderState.durationMillis, accumulatedDurationMs]);

  return {
    status,
    note,
    setNote,
    recorderState,
    totalDurationMs,
    actions: {
      startRecording,
      handleTogglePauseResume,
      stopRecording,
      handleFinishAndSave,
      handleDiscard,
      handleFinalDiscard,
      handleContinue,
    },
  };
};
