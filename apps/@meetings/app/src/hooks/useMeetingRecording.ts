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

import { useIsFocused } from "@react-navigation/native";
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
  onComplete?: () => void;
  getNotes?: () => string | Promise<string>;
}

interface UseMeetingRecordingReturn {
  status: RecordingStatus;
  setStatus: (status: RecordingStatus) => void;
  note: string;
  setNote: (note: string) => void;
  recorderState: ReturnType<typeof useAudioRecorderState>;
  totalDurationMs: number;
  actions: {
    initializeRecording: () => Promise<void>;
    startRecording: () => Promise<void>;
    handleTogglePauseResume: () => Promise<void>;
    stopRecording: () => void;
    stopAndUploadRecording: (
      uploadFn: (uri: string) => Promise<void>,
    ) => Promise<void>;
    uploadSegmentToGCS: (uri: string) => Promise<void>;
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
  getNotes,
}: UseMeetingRecordingParams): UseMeetingRecordingReturn => {
  const [note, setNote] = useState("");
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [accumulatedDurationMs, setAccumulatedDurationMs] = useState(0);

  useEffect(() => {
    getItem("durationMs").then((duration) => {
      setAccumulatedDurationMs(Number(duration) || 0);
      setTotalDurationMs(Number(duration) || 0);
    })
  }, [])

  const isFocused = useIsFocused();

  const {
    status,
    setStatus,
    recorderState,
    initializeRecording,
    startRecording,
    stopRecording,
    stopAndUploadRecording,
    togglePauseResume: contextTogglePauseResume,
    cleanupRecording,
  } = useRecording();

  const prevRecorderStateRef = useRef(recorderState.isRecording);

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
    {
      clientId: person.personId,
      meetingId: meetingId ?? "",
      platform: Platform.OS as "web" | "ios" | "android",
    },
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

      // Use webm for web, m4a for mobile
      const contentType = Platform.OS === "web" ? "audio/webm" : "audio/m4a";

      try {
        if (Platform.OS === "web") {
          const response = await fetch(uri);
          const blob = await response.blob();
          await fetch(signedUrl, {
            method: "PUT",
            body: blob,
            headers: { "Content-Type": contentType },
          });
        } else {
          await FileSystem.uploadAsync(signedUrl, uri, {
            httpMethod: "PUT",
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: { "Content-Type": contentType },
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
        throw error;
      }
    },
    [refetch, accumulatedDurationMs, recorderState.durationMillis],
  );

  const resolveNotes = useCallback(async (): Promise<string> => {
    if (getNotes) {
      return getNotes();
    }
    return (await getItem("note")) ?? "";
  }, [getNotes]);

  const handleTogglePauseResume = useCallback(async () => {
    await contextTogglePauseResume(uploadSegmentToGCS);

    // Update notes after pausing
    if (status === "recording") {
      try {
        const notes = await resolveNotes();
        await updateNotesMutation.mutateAsync({
          clientId: person.personId,
          meetingId,
          notes,
        });
      } catch (err) {
        console.error("Failed to update notes:", err);
      }
    }
  }, [
    contextTogglePauseResume,
    uploadSegmentToGCS,
    status,
    resolveNotes,
    updateNotesMutation,
    person.personId,
    meetingId,
  ]);

  const handleFinishAndSave = useCallback(async () => {
    setStatus("ending");

    try {
      if (recorderState.isRecording) {
        await stopAndUploadRecording(uploadSegmentToGCS);
      }

      const notes = await resolveNotes();
      await removeItem("note");

      await endMeetingMutation.mutateAsync({
        clientId: person.personId,
        meetingId,
        notes,
      });

      await cleanupRecording();
      onComplete?.();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  }, [
    setStatus,
    recorderState.isRecording,
    stopAndUploadRecording,
    uploadSegmentToGCS,
    resolveNotes,
    endMeetingMutation,
    person.personId,
    meetingId,
    cleanupRecording,
    onComplete,
  ]);

  const handleContinue = () => setStatus("recording");
  const handleDiscard = () => setStatus("discarding");

  const handleFinalDiscard = useCallback(async () => {
    await cleanupRecording();

    await discardMeetingMutation.mutateAsync({
      clientId: person.personId,
      meetingId,
    });

    onComplete?.();
  }, [
    cleanupRecording,
    discardMeetingMutation,
    person.personId,
    meetingId,
    onComplete,
  ]);

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
    if (!isFocused) return;
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

    // handleAutoStop causes infinite loop if not disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, recorderState.isRecording]);

  useEffect(() => {
    if (status === "recording") {
      setTotalDurationMs(accumulatedDurationMs + recorderState.durationMillis);
    }
  }, [status, recorderState.durationMillis, accumulatedDurationMs]);

  useEffect(() => {
    (async () => {
      await initializeRecording();
      const saved = await getItem("note");
      setNote(saved);
      requestNotificationPermissions();
    })();
    // initializeRecording and requestNotificationPermissions are only needed to be called once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    setStatus,
    note,
    setNote,
    recorderState,
    totalDurationMs,
    actions: {
      initializeRecording,
      startRecording,
      handleTogglePauseResume,
      stopRecording,
      stopAndUploadRecording,
      uploadSegmentToGCS,
      handleFinishAndSave,
      handleDiscard,
      handleFinalDiscard,
      handleContinue,
    },
  };
};
