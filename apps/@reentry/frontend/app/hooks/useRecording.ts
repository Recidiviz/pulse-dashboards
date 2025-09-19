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

import { captureException, withScope } from "@sentry/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";

import { $api } from "~@reentry/frontend/api";
import { useQueue } from "~@reentry/frontend/contexts/QueueContext";
import { useAuth } from "~@reentry/frontend/lib/auth";
import type {
  RecordingActions,
  RecordingSessionResponse,
  RecordingState,
  RecordingStatus,
  UIRecordingStatus,
} from "~@reentry/frontend/types/recording";
import {
  blobToBase64,
  cleanupMediaResources,
  isWithinSessionResume,
  restoreChunkCounter,
  validateRecordingCapabilities,
} from "~@reentry/frontend/utils/recording";
import {
  showErrorToast,
  showSuccessToast,
} from "~@reentry/frontend/utils/toast";

import { useUpdateRecordingStatus } from "./useUpdateRecordingStatus";

interface UseRecordingProps {
  supportedFormat: string | null;
  isRecordingSupported: boolean;
  sessionId?: string | null;
  sessionData?: RecordingSessionResponse | null;
  onRecordingStopped?: () => void;
}

export const useRecording = ({
  supportedFormat,
  isRecordingSupported,
  sessionId,
  sessionData,
  onRecordingStopped,
}: UseRecordingProps): RecordingState & RecordingActions => {
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("created");
  const [uiStatus, setUiStatus] = useState<UIRecordingStatus>("created");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const { getAccessToken } = useAuth();
  const { updateStatus } = useUpdateRecordingStatus();
  const queue = useQueue();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkCounterRef = useRef(0);
  const [chunkCount, setChunkCount] = useState(0);

  // session recovery: check for paused sessions on mount and restore state
  useEffect(() => {
    if (!sessionData || !sessionId) {
      return;
    }

    // Check if this session was previously paused
    const isSessionPaused = sessionData.status === "paused";

    if (isSessionPaused) {
      console.log("Recovering paused session:", sessionId);
      console.log("Session data structure:", sessionData);

      // Restore session state
      setRecordingStatus("paused");
      setUiStatus("paused");

      // Restore chunk counter from backend
      const restoredChunkCount = restoreChunkCounter(sessionData);
      chunkCounterRef.current = restoredChunkCount;
      setChunkCount(restoredChunkCount);

      // Restore microphone selection if available
      // Note: We'd need to add selectedMicrophone to session data in the future
      // For now, microphone will be set by RecordingInterface's useEffect

      console.log(
        `Session recovered: status=paused, chunkCount=${restoredChunkCount}`,
      );
    }
  }, [sessionData, sessionId]);

  const { mutateAsync: finalizeRecordingMutation } = $api.useMutation(
    "post",
    "/recordings/sessions/{session_id}/finalize",
  );

  const updateRecordingStatus = useCallback(
    async (newStatus: RecordingStatus) => {
      setRecordingStatus(newStatus);
      setUiStatus(newStatus);

      if (sessionId) {
        try {
          await updateStatus(sessionId, newStatus);
        } catch (error) {
          console.error("Failed to update backend status:", error);
        }
      }
    },
    [sessionId, updateStatus],
  );

  const queueChunk = useCallback(
    async (chunk: Blob, chunkIndex: number) => {
      if (!sessionId) {
        console.warn("No session ID available for chunk upload");
        return;
      }

      // Check if queue is accepting chunks (backpressure)
      if (!queue.isAcceptingChunks()) {
        console.warn("Queue not accepting chunks, stopping recording");
        showErrorToast("Recording stopped: upload queue full");
        // Stop MediaRecorder if running
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive"
        ) {
          mediaRecorderRef.current.stop();
        }
        return;
      }

      // Determine if this chunk has WebM headers
      const restoredChunkCount = sessionData?.chunk_count || 0;
      const isFirstChunk = chunkIndex === 0;
      const isFirstResumeChunk =
        sessionData?.status === "paused" && chunkIndex === restoredChunkCount;
      const hasHeader = isFirstChunk || isFirstResumeChunk;

      try {
        const base64Data = await blobToBase64(chunk);

        await queue.pushChunk({
          sessionId,
          chunkIndex,
          chunkData: base64Data,
          mimeType: chunk.type,
          hasHeader,
        });

        console.debug(
          `Chunk ${chunkIndex} queued for upload (hasHeader: ${hasHeader})`,
        );
      } catch (error) {
        console.error(`Error queueing chunk ${chunkIndex}:`, error);
        showErrorToast(`Failed to queue chunk ${chunkIndex}`);
      }
    },
    [sessionId, sessionData, queue],
  );

  const startRecording = useCallback(async () => {
    try {
      validateRecordingCapabilities(
        selectedMicrophone,
        isRecordingSupported,
        supportedFormat || "",
      );
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Recording validation failed",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicrophone
          ? { deviceId: { exact: selectedMicrophone } }
          : true,
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedFormat || undefined,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.debug(
            `Chunk ${chunkCounterRef.current} ready: ${event.data.size} bytes`,
          );
          queueChunk(event.data, chunkCounterRef.current);
          chunkCounterRef.current++;
          setChunkCount(chunkCounterRef.current);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        showErrorToast(
          `An error occurred during the recording: ${event.error?.message} . Please refresh the page.`,
        );

        const error = new Error(
          `MediaRecorder error: ${event.error?.message || "Unknown error"}`,
        );
        withScope((scope) => {
          scope.setContext("mediaRecorder", {
            sessionId: sessionId,
            state: mediaRecorder.state,
            mimeType: mediaRecorder.mimeType,
            errorName: event.error?.name,
            errorMessage: event.error?.message,
            eventType: event.type,
          });
          captureException(error);
        });
      };

      mediaRecorder.start(5000);

      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      await updateRecordingStatus("recording");

      showSuccessToast("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      showErrorToast(
        `Failed to start recording ${error}. Please refresh the page.`,
      );

      const sentryError = new Error(`Error: ${error || "Unknown error"}`);
      withScope((scope) => {
        scope.setContext("mediaRecorder", {
          function: "startRecording",
          sessionId: sessionId,
          selectedMicrophone: selectedMicrophone,
          mimeType: supportedFormat,
          isRecordingSupported,
        });
        captureException(sentryError);
      });
    }
  }, [
    selectedMicrophone,
    isRecordingSupported,
    supportedFormat,
    updateRecordingStatus,
    queueChunk,
  ]);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      // Request any buffered data before pausing to prevent data loss on page refresh.
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.pause();
    }

    updateRecordingStatus("paused");
  }, [updateRecordingStatus]);

  const resumeRecording = useCallback(async () => {
    try {
      // Determine if this is within-session or cross-session resume
      const isWithinSession = isWithinSessionResume(mediaRecorderRef.current);

      if (isWithinSession) {
        // MediaRecorder exists and is paused - just resume it
        console.log("Within-session resume: using existing MediaRecorder");

        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.resume();
        }
      } else {
        // cross sessions: create new mediaRecorder
        console.log("Cross-session resume: creating new MediaRecorder");

        // Validate capabilities first
        validateRecordingCapabilities(
          selectedMicrophone,
          isRecordingSupported,
          supportedFormat || "",
        );

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicrophone
            ? { deviceId: { exact: selectedMicrophone } }
            : true,
        });

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: supportedFormat || undefined,
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.debug(
              `Chunk ${chunkCounterRef.current} ready: ${event.data.size} bytes`,
            );
            queueChunk(event.data, chunkCounterRef.current);
            chunkCounterRef.current++;
            setChunkCount(chunkCounterRef.current);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          showErrorToast(
            `Recording error occurred: ${event.error?.message}. Please refresh the page.`,
          );

          const error = new Error(
            `MediaRecorder error: ${event.error?.message || "Unknown error"}`,
          );
          withScope((scope) => {
            scope.setContext("mediaRecorder", {
              sessionId: sessionId,
              state: mediaRecorder.state,
              mimeType: mediaRecorder.mimeType,
              errorName: event.error?.name,
              errorMessage: event.error?.message,
              eventType: event.type,
            });
            captureException(error);
          });
        };

        mediaRecorder.start(5000);

        mediaRecorderRef.current = mediaRecorder;
        streamRef.current = stream;
      }

      // Update status for both scenarios
      await updateRecordingStatus("recording");
      showSuccessToast(
        isWithinSession
          ? "Recording resumed"
          : "Recording resumed from previous session",
      );
    } catch (error) {
      console.error("Error resuming recording:", error);
      showErrorToast(
        `Failed to resume the recording: ${error}. Please refresh the page to try again.`,
      );

      const sentryError = new Error(`Error: ${error}`);
      withScope((scope) => {
        scope.setContext("mediaRecorder", {
          sessionId: sessionId,
          function: "resumeRecording",
          selectedMicrophone: selectedMicrophone,
          mimeType: supportedFormat,
          isRecordingSupported,
        });
        captureException(sentryError);
      });
    }
  }, [
    selectedMicrophone,
    isRecordingSupported,
    supportedFormat,
    updateRecordingStatus,
    queueChunk,
  ]);

  const finalizeRecording = useCallback(async () => {
    if (!sessionId || chunkCounterRef.current === 0) {
      return;
    }

    try {
      await finalizeRecordingMutation({
        params: { path: { session_id: sessionId } },
        body: {
          total_chunks: chunkCounterRef.current,
        },
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/json",
        },
      });

      showSuccessToast("Recording finalized successfully!");
    } catch (error) {
      console.error("Error finalizing recording:", error);
      showErrorToast("Failed to finalize recording");
    }
  }, [sessionId, finalizeRecordingMutation, getAccessToken]);

  const stopRecording = useCallback(async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    cleanupMediaResources(streamRef.current, null);
    streamRef.current = null;

    setUiStatus("processing");

    setTimeout(async () => {
      if (sessionId && chunkCounterRef.current > 0) {
        await finalizeRecording();
        // Backend already sets status to "completed", so just update frontend state
        setRecordingStatus("completed");
        setUiStatus("completed");
      }
      chunkCounterRef.current = 0;
      setChunkCount(0);
    }, 3000);

    // Notify that recording has been stopped (so polling can start)
    onRecordingStopped?.();

    showSuccessToast("Recording stopped");
  }, [sessionId, onRecordingStopped, finalizeRecording]);

  return {
    status: recordingStatus,
    uiStatus,
    selectedMicrophone,
    microphones: [],
    chunkCount,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setSelectedMicrophone,
  };
};
