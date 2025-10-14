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
  RecordingState,
  RecordingStatus,
  UIRecordingStatus,
} from "~@reentry/frontend/types/recording";
import {
  blobToBase64,
  cleanupMediaResources,
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
  sessionStatus?: string | null;
  sessionChunkCount?: number;
  onRecordingStopped?: () => void;
}

export const useRecording = ({
  supportedFormat,
  isRecordingSupported,
  sessionId,
  sessionStatus,
  sessionChunkCount = 0,
  onRecordingStopped,
}: UseRecordingProps): RecordingState & RecordingActions => {
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("created");
  const [uiStatus, setUiStatus] = useState<UIRecordingStatus>("created");
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>("");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [cannotConnectToServer, setCannotConnectToServer] = useState(false);
  const { getAccessToken } = useAuth();
  const { updateStatus } = useUpdateRecordingStatus();
  const queue = useQueue();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkCounterRef = useRef(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const lastDataSendedTimeRef = useRef<number | null>(null);

  const { mutateAsync: finalizeRecordingMutation } = $api.useMutation(
    "post",
    "/recordings/sessions/{session_id}/finalize",
  );

  // Track online/offline status
  const isBackOnline = useCallback(() => {
    if (!isOnline) {
      showSuccessToast("You are back online.");
    }
    setIsOnline(true);
  }, [isOnline]);

  const isBackOffline = useCallback(() => {
    if (isOnline) {
      showErrorToast("You are offline. Recording will continue locally.");
    }
    setIsOnline(false);
  }, [isOnline]);

  useEffect(() => {
    const handleOnline = () => isBackOnline();
    const handleOffline = () => isBackOffline();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Poll queue for server connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const cannotConnect = queue.cannotConnectToServer();
      setCannotConnectToServer(cannotConnect);
    }, 1000);

    return () => clearInterval(interval);
  }, [queue]);

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
    async (
      chunk: Blob,
      chunkIndex: number,
      timestamp: number,
      chunkDuration: number,
    ) => {
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
      const restoredChunkCount = sessionChunkCount || 0;
      const isFirstChunk = chunkIndex === 0;
      const isFirstResumeChunk =
        sessionStatus === "paused" && chunkIndex === restoredChunkCount;
      const hasHeader = isFirstChunk || isFirstResumeChunk;

      try {
        const base64Data = await blobToBase64(chunk);

        await queue.pushChunk({
          sessionId,
          chunkIndex,
          timestamp,
          chunkData: base64Data,
          mimeType: chunk.type,
          hasHeader,
          chunkDuration,
        });

        console.debug(
          `Chunk ${chunkIndex} queued for upload (hasHeader: ${hasHeader}, duration: ${chunkDuration.toFixed(2)}s)`,
        );
      } catch (error) {
        console.error(`Error queueing chunk ${chunkIndex}:`, error);
        showErrorToast(`Failed to queue chunk ${chunkIndex}`);
      }
    },
    [sessionId, sessionChunkCount, sessionStatus, queue],
  );

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

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      // Request any buffered data before pausing to prevent data loss on page refresh.
      console.log(mediaRecorderRef);
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.pause();

      recordingStartTimeRef.current = null;

      // Stop all microphone tracks to release microphone access
      // This will show that the microphone is no longer in use
      if (streamRef.current) {
        console.log("Stopping microphone tracks on pause", streamRef.current);
        console.log("Tracks", streamRef.current.getTracks());
        streamRef.current.getTracks().forEach((track) => {
          console.log(track);
          track.stop();
        });
        streamRef.current = null;
      }
    }

    updateRecordingStatus("paused");
  }, [updateRecordingStatus]);

  const handleTrackEnded = useCallback(async () => {
    console.warn("Microphone track ended - device disconnected");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      console.warn("Pausing recording due to microphone disconnection");
      await pauseRecording();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Pause operations completed");
    }
    alert("Microphone disconnected. Recording paused.");
  }, [pauseRecording]);

  // Cleanup microphone resources on page refresh/unload
  const cleanupMicrophoneOnUnload = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.removeEventListener("ended", handleTrackEnded);
        track.stop();
      });
      streamRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.log("MediaRecorder already stopped or error stopping:", error);
      }
    }
  }, []);

  const handleRecordingStart = useCallback(() => {
    const currentTime = Date.now();
    recordingStartTimeRef.current = currentTime;
    lastDataSendedTimeRef.current = currentTime;
  }, []);

  const handleDataAvailable = useCallback(
    (event: BlobEvent) => {
      if (event.data.size > 0) {
        const currentTime = Date.now();
        const chunkDuration = lastDataSendedTimeRef.current
          ? currentTime - lastDataSendedTimeRef.current
          : 0;
        lastDataSendedTimeRef.current = currentTime;

        console.log(`Chunk duration: ${chunkDuration.toFixed(2)} seconds`);

        const absoluteTimestamp = Date.now();
        console.log(
          `Chunk ${chunkCounterRef.current} ready: ${event.data.size} bytes at timestamp ${absoluteTimestamp}`,
        );
        queueChunk(
          event.data,
          chunkCounterRef.current,
          absoluteTimestamp,
          chunkDuration,
        );
        chunkCounterRef.current++;
        setChunkCount(chunkCounterRef.current);
      }
    },
    [queueChunk],
  );

  const handleRecordingError = useCallback(
    (mediaRecorder: MediaRecorder) => (event: Event) => {
      console.error("MediaRecorder error:", event);
      showErrorToast(
        `An error occurred during the recording: ${(event as ErrorEvent).error?.message} . Please refresh the page.`,
      );

      const error = new Error(
        `MediaRecorder error: ${(event as ErrorEvent).error?.message || "Unknown error"}`,
      );
      withScope((scope) => {
        scope.setContext("mediaRecorder", {
          sessionId: sessionId,
          state: mediaRecorder.state,
          mimeType: mediaRecorder.mimeType,
          errorName: (event as ErrorEvent).error?.name,
          errorMessage: (event as ErrorEvent).error?.message,
          eventType: event.type,
        });
        captureException(error);
      });
    },
    [sessionId],
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

      mediaRecorder.onstart = handleRecordingStart;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onerror = handleRecordingError(mediaRecorder);

      mediaRecorder.start(5000);

      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;

      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", handleTrackEnded);
      });

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
    handleRecordingStart,
    handleDataAvailable,
    handleRecordingError,
  ]);

  const resumeRecording = useCallback(async () => {
    try {
      // Since we stop the stream during pause, we always need to create a new MediaRecorder
      // when resuming, whether it's within-session or cross-session
      console.log("Resume: creating new MediaRecorder and stream");

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

      mediaRecorder.onstart = handleRecordingStart;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onerror = handleRecordingError(mediaRecorder);

      mediaRecorder.start(5000);

      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;

      stream.getTracks().forEach((track) => {
        track.addEventListener("ended", handleTrackEnded);
      });

      // Update status
      await updateRecordingStatus("recording");
      showSuccessToast("Recording resumed");
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
    handleRecordingStart,
    handleDataAvailable,
    handleRecordingError,
  ]);

  const stopRecording = useCallback(async () => {
    if (uiStatus !== "processing") {
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
        recordingStartTimeRef.current = null;
      }, 3000);

      // Notify that recording has been stopped (so polling can start)
      onRecordingStopped?.();

      showSuccessToast("Recording stopped");
    }
  }, [sessionId, uiStatus, onRecordingStopped, finalizeRecording]);

  // session recovery: check for paused sessions on mount and restore state
  useEffect(() => {
    if (!sessionStatus || !sessionId) {
      return;
    }

    // Check if this session was previously paused
    const isSessionPaused =
      sessionStatus === "paused" || sessionStatus === "recording";

    if (isSessionPaused) {
      console.log("Recovering paused session:", sessionId);
      if (!hasInitialized) {
        setHasInitialized(true);
      }

      // Restore chunk counter from backend
      const restoredChunkCount = sessionChunkCount || 0;
      chunkCounterRef.current = restoredChunkCount;
      setChunkCount(restoredChunkCount);
      // Restore microphone selection if available
      // Note: We'd need to add selectedMicrophone to session data in the future
      // For now, microphone will be set by RecordingInterface's useEffect

      console.log(
        `Session recovered: status=paused, chunkCount=${restoredChunkCount}`,
      );
    }
  }, [sessionStatus, sessionId, sessionChunkCount, hasInitialized]);

  // Cleanup microphone on page refresh/unload
  useEffect(() => {
    const handlePageUnload = () => {
      // Synchronous cleanup for better reliability
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.log(
            "MediaRecorder already stopped or error stopping:",
            error,
          );
        }
      }
    };
    // Use pagehide for more reliable cleanup, especially on mobile
    window.addEventListener("beforeunload", handlePageUnload);
    return () => {
      window.removeEventListener("beforeunload", handlePageUnload);
    };
  }, [cleanupMicrophoneOnUnload]);

  useEffect(() => {
    if (hasInitialized || !sessionStatus || !sessionId) {
      return;
    }
    setHasInitialized(true);
    if (sessionStatus === "recording") {
      pauseRecording();
    }
  }, [sessionStatus, sessionId, pauseRecording, hasInitialized]);

  return {
    status: recordingStatus,
    uiStatus,
    selectedMicrophone,
    microphones: [],
    chunkCount,
    isOnline,
    mediaRecorderRef,
    cannotConnectToServer,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setSelectedMicrophone,
  };
};
