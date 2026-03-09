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

import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef } from "react";
import { Alert } from "react-native";

import { trpc } from "~@meetings/app/trpc/client";
import { getItem, removeItem } from "~@meetings/app/utils/storage";

import { useRecording } from "../model";
import { sendNotification } from "../utils/notifications";
import { useDiscardMeeting } from "./useDiscardMeeting";
import { useEndMeeting } from "./useEndMeeting";

// TODO(#11571): get rid of this hook, move all the code into models
export const useMeetingRecording = ({
  meetingId,
  onComplete,
  personId,
}: {
  meetingId: string;
  onComplete?: () => void;
  personId: bigint;
}) => {
  const isFocused = useIsFocused();

  const {
    status,
    setStatus,
    isRecording,
    note,
    setNote,
    startRecording,
    stopRecording,
    discardRecording,
    stopAndUploadRecording,
    togglePauseResume: contextTogglePauseResume,
    cleanupRecording,
  } = useRecording();

  const prevRecorderStateRef = useRef(isRecording);

  const { mutateAsync: endMeeting } = useEndMeeting(personId);
  const { mutateAsync: discardMeeting } = useDiscardMeeting(personId);

  const updateNotesMutation = trpc.v1.meeting.updateNotes.useMutation({
    onSuccess: () => {
      console.log("Notes updated successfully on server");
    },
    onError: (err) => {
      console.error("[updateNotes] Failed:", err);
    },
  });

  const resolveUserNotepadNotes = useCallback(async (): Promise<string> => {
    return (await getItem("note")) ?? "";
  }, []);

  const handleTogglePauseResume = useCallback(async () => {
    await contextTogglePauseResume();

    // Update notes after pausing
    if (status === "recording") {
      try {
        const userNotepadNotes = await resolveUserNotepadNotes();
        await updateNotesMutation.mutateAsync({
          meetingId,
          userNotepadNotes,
        });
      } catch (err) {
        console.error("Failed to update notes:", err);
      }
    }
  }, [
    contextTogglePauseResume,
    status,
    resolveUserNotepadNotes,
    updateNotesMutation,
    meetingId,
  ]);

  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  const handleFinishAndSave = useCallback(async () => {
    setStatus("ending");

    try {
      if (isRecording) {
        await stopAndUploadRecording();
      }

      const userNotepadNotes = await resolveUserNotepadNotes();
      await removeItem("note");

      await endMeeting({ meetingId, userNotepadNotes });

      await cleanupRecording();
      onComplete?.();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      Alert.alert("Error", "Failed to end meeting. Please try again.");
      setStatus("idle");
    }
  }, [
    setStatus,
    isRecording,
    stopAndUploadRecording,
    resolveUserNotepadNotes,
    endMeeting,
    meetingId,
    cleanupRecording,
    onComplete,
  ]);

  const handleContinue = () => contextTogglePauseResume();
  const handleDiscard = () => discardRecording();

  const handleFinalDiscard = useCallback(async () => {
    await cleanupRecording();

    await discardMeeting({ meetingId });

    onComplete?.();
  }, [cleanupRecording, discardMeeting, meetingId, onComplete]);

  const handleAutoStopRecording = useCallback(async () => {
    setStatus("uploading");
    await stopAndUploadRecording();
    setStatus("paused");

    sendNotification(
      "Recording Paused",
      "90 minute-at-a-time recording limit reached. Pausing Recording",
    );
  }, [setStatus, stopAndUploadRecording]);

  // Auto-stop recording when limit is reached
  useEffect(() => {
    if (!isFocused) return;
    //introduced to keep track of previous recorder state to prevent initial triggering of the handleAutoStopRecording function
    const prevIsRecording = prevRecorderStateRef.current;

    // Only trigger auto-stop if we're in "recording" status and the recorder stopped unexpectedly
    // (not when user manually stopped via stopRecording which sets status to "stopping")
    if (status === "recording" && prevIsRecording && !isRecording) {
      handleAutoStopRecording();
    }

    // Don't update the ref when transitioning to "stopping" status to avoid false triggers
    if (status !== "stopping") {
      prevRecorderStateRef.current = isRecording;
    }

    // handleAutoStop causes infinite loop if not disabled
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isRecording]);

  return {
    status,
    setStatus,
    note,
    setNote,
    isRecording,
    actions: {
      startRecording,
      handleTogglePauseResume,
      handleStopRecording,
      stopAndUploadRecording,
      handleFinishAndSave,
      handleDiscard,
      handleFinalDiscard,
      handleContinue,
    },
  };
};
