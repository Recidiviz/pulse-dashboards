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

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import EndAssessmentModal from "~@reentry/frontend/components/recording/modals/EndAssessmentModal";
import LiveAssessmentModal from "~@reentry/frontend/components/recording/modals/LiveAssessmentModal";
import { useQueue } from "~@reentry/frontend/contexts/QueueContext";
import { useAudioCapabilities } from "~@reentry/frontend/hooks/useAudioCapabilities";
import { useRecording } from "~@reentry/frontend/hooks/useRecording";
import { useRecordingSessionStatus } from "~@reentry/frontend/hooks/useRecordingSessionStatus";
import type {
  ClientRecordResponse,
  RecordingSessionResponse,
} from "~@reentry/frontend/types/recording";
import { isFeatureEnabled } from "~@reentry/frontend/utils/featureFlagsRuntime";
import { showInfoToast } from "~@reentry/frontend-shared";

import AudioFileUpload from "./AudioFileUpload";
import AudioWaveform from "./AudioWaveform";
import RecordingControls from "./RecordingControls";
import { SimpleAudioPlayer } from "./SimpleAudioPlayer";

interface RecordingInterfaceProps {
  clientRecord: ClientRecordResponse | null | undefined;
  sessionData: RecordingSessionResponse | null | undefined;
  onRecordingStopped?: () => void;
  setNeedsAddress: (needs: boolean) => void;
  onRecordingStatusChange?: (status: string) => void;
  onSafeNavigateReady?: (safeNavigate: (path: string) => void) => void;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  clientRecord,
  sessionData,
  onRecordingStopped,
  setNeedsAddress,
  onRecordingStatusChange,
  onSafeNavigateReady,
}) => {
  const { statusData } = useRecordingSessionStatus(sessionData?.id || "", true);
  const [recordingStopped, setRecordingStopped] = useState(false);
  const [liveAssessmentOpen, setLiveAssessmentOpen] = useState(false);
  const [endAssessmentOpen, setEndAssessmentOpen] = useState(false);
  const [modalConfirmAction, setModalConfirmAction] = useState<
    (() => void) | null
  >(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );
  const [recordDuration, setRecordDuration] = useState(0);
  const [inputMode, setInputMode] = useState<"recording" | "upload">(
    "recording",
  );
  const [hasFileSelected, setHasFileSelected] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  const blockNavigationRef = useRef(false);

  const audioCapabilities = useAudioCapabilities();
  const router = useRouter();
  const queue = useQueue();

  const handleRecordingStopped = () => {
    setRecordingStopped(true);
    onRecordingStopped?.();
  };

  const recording = useRecording({
    supportedFormat: audioCapabilities.supportedFormat,
    isRecordingSupported: audioCapabilities.isRecordingSupported,
    sessionId: sessionData?.id,
    sessionStatus: sessionData?.status,
    sessionChunkCount: sessionData?.chunk_count,
    onRecordingStopped: handleRecordingStopped,
    clientPseudoId: clientRecord?.pseudonymized_client_id,
  });

  // Notify parent component of recording status changes
  useEffect(() => {
    onRecordingStatusChange?.(recording.uiStatus);
  }, [recording.uiStatus, onRecordingStatusChange]);

  // Update record duration periodically when recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const updateRecordDuration = async () => {
      try {
        const totalDuration = await queue.getTotalAudioDuration(
          sessionData?.id || "",
        );
        setRecordDuration(totalDuration);
      } catch (error) {
        console.error("Failed to get queue duration:", error);
      }
    };

    if (["recording", "paused", "created"].includes(recording.uiStatus)) {
      updateRecordDuration(); // Initial update
      interval = setInterval(updateRecordDuration, 1000); // Update every second
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [recording.uiStatus, queue, sessionData?.id]);

  // Block navigation when recording is active
  useEffect(() => {
    const isRecordingActive = recording.uiStatus === "recording";
    blockNavigationRef.current = isRecordingActive;

    if (isRecordingActive) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "You have an active recording. Are you sure you want to leave?";
        return "You have an active recording. Are you sure you want to leave?";
      };

      const handlePopState = (e: PopStateEvent) => {
        console.log("handlePopState triggered");
        if (blockNavigationRef.current) {
          e.preventDefault();
          window.history.pushState(null, "", window.location.pathname);
          setConfirmDialogOpen(true);
        }
        return;
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
      window.history.pushState(null, "", window.location.pathname);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      };
    }
    // Always return undefined if not recording
    return undefined;
  }, [recording.uiStatus]);

  //Select first available microphone by default
  useEffect(() => {
    if (
      audioCapabilities.microphones.length > 0 &&
      !recording.selectedMicrophone
    ) {
      recording.setSelectedMicrophone(
        audioCapabilities.microphones[0].deviceId,
      );
    }
  }, [audioCapabilities.microphones, recording]);

  const updateWakeLockState = useCallback(
    (wakeLockActive: boolean) => {
      if (!isWakeLockActive && wakeLockActive) {
        showInfoToast("Opacity reduced to preserve battery during recording.");
      }
      setIsWakeLockActive(wakeLockActive);
    },
    [isWakeLockActive],
  );

  // Check wakelock status periodically to update overlay
  useEffect(() => {
    const checkWakeLock = () => {
      if (recording.isWakeLockActive) {
        const wakeLockActive = recording.isWakeLockActive();
        console.log("Wake Lock Active:", wakeLockActive);
        updateWakeLockState(wakeLockActive);
      }
    };

    // Check immediately and then every second
    checkWakeLock();
    const interval = setInterval(checkWakeLock, 1000);

    return () => clearInterval(interval);
  }, [recording]);

  const openLiveAssessmentModal = (action: () => void) => {
    setModalConfirmAction(() => action);
    setLiveAssessmentOpen(true);
  };

  const handleLiveAssessmentConfirm = () => {
    modalConfirmAction?.();
    setLiveAssessmentOpen(false);
  };

  const handleEndAssessmentConfirm = () => {
    recording.stopRecording();
    setEndAssessmentOpen(false);
    setNeedsAddress(true);
  };

  const handleInputModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "recording" | "upload" | null,
  ) => {
    // Only allow mode change if recording hasn't started and no file is selected
    const hasRecordingStarted =
      ["recording", "paused", "stopped", "processing"].includes(
        recording.uiStatus,
      ) || recording.chunkCount > 0;
    if (newMode !== null && !hasRecordingStarted && !hasFileSelected) {
      setInputMode(newMode);
    }
  };

  const handleFileSelected = (file: File) => {
    console.log("File selected:", file);
    setHasFileSelected(true);
  };

  const handleFileClear = () => {
    setHasFileSelected(false);
  };
  // Safe navigation function that checks if recording is active
  const safeNavigate = useCallback(
    (path: string) => {
      if (recording.uiStatus === "recording") {
        // Recording is active, show confirmation dialog
        setPendingNavigation(path);
        setConfirmDialogOpen(true);
      } else {
        // No active recording, navigate directly
        router.push(path);
      }
    },
    [recording.uiStatus, router],
  );

  // Expose safeNavigate function to parent component
  useEffect(() => {
    if (onSafeNavigateReady) {
      onSafeNavigateReady(safeNavigate);
    }
  }, [onSafeNavigateReady, safeNavigate]);

  if (!clientRecord || !sessionData) {
    return (
      <div className="w-full max-w-7xl">
        <Paper elevation={1}>
          <div className="bg-white p-6 text-center">
            <Typography>Loading recording session...</Typography>
          </div>
        </Paper>
      </div>
    );
  }

  const shouldShowControls =
    recording.uiStatus !== "completed" &&
    ["created", "paused", "recording"].includes(sessionData.status);

  const shouldShowPlayer =
    recording.uiStatus === "completed" ||
    recording.uiStatus === "processing" ||
    !!sessionData.gcs_final_file_path ||
    sessionData.status === "processing";

  const hasRecordingStarted =
    ["recording", "paused", "stopped", "processing"].includes(
      recording.uiStatus,
    ) || recording.chunkCount > 0;
  const isToggleDisabled = hasRecordingStarted || hasFileSelected;

  const getTooltipMessage = () => {
    if (hasRecordingStarted) {
      return "Cannot switch modes while recording is in progress";
    }
    if (hasFileSelected) {
      return "Clear the selected file to switch modes";
    }
    return "";
  };

  return (
    <div className="w-full flex flex-col">
      {shouldShowControls && (
        <>
          {isFeatureEnabled("UPLOAD_AUDIO") && (
            <Box className="p-4 flex justify-center">
              <Tooltip
                title={getTooltipMessage()}
                arrow
                disableHoverListener={!isToggleDisabled}
              >
                <div className="px-4 sm:px-6 py-2 sm:py-2 bg-white rounded-[32px] sm:rounded-[99px] outline outline-1 outline-offset-[-1px] outline-[#2b5469]/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleInputModeChange(e, "recording")}
                    disabled={isToggleDisabled}
                    className={`h-8 px-4 py-2 rounded-[32px] text-xs sm:text-[13px] font-medium font-['Public_Sans'] whitespace-nowrap transition-colors duration-300 ${(() => {
                      if (inputMode === "recording")
                        return "bg-[#006c67] text-white";
                      if (isToggleDisabled)
                        return "bg-gray-200 text-gray-400 cursor-not-allowed";
                      return "bg-transparent text-[#345262]/90 hover:bg-gray-100";
                    })()}`}
                  >
                    Recording
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleInputModeChange(e, "upload")}
                    disabled={isToggleDisabled}
                    className={`h-8 px-4 py-2 rounded-[32px] text-xs sm:text-[13px] font-medium font-['Public_Sans'] whitespace-nowrap transition-colors duration-300 ${(() => {
                      if (inputMode === "upload")
                        return "bg-[#006c67] text-white";
                      if (isToggleDisabled)
                        return "bg-gray-200 text-gray-400 cursor-not-allowed";
                      return "bg-transparent text-[#345262]/90 hover:bg-gray-100";
                    })()}`}
                  >
                    File Upload
                  </button>
                </div>
              </Tooltip>
            </Box>
          )}

          {inputMode === "recording" ? (
            <>
              <RecordingControls
                recordingStatus={recording.uiStatus}
                selectedMicrophone={recording.selectedMicrophone}
                microphones={audioCapabilities.microphones}
                isRecordingSupported={audioCapabilities.isRecordingSupported}
                chunkCount={recording.chunkCount}
                uploadDuration={
                  statusData?.duration
                    ? Math.floor(statusData.duration / 1000)
                    : 0
                }
                recordDuration={Math.floor(recordDuration / 1000)}
                openLiveAssessmentModal={openLiveAssessmentModal}
                setEndAssessmentOpen={setEndAssessmentOpen}
                isOnline={recording.isOnline}
                cannotConnectToServer={recording.cannotConnectToServer}
                pausedByVisibilityChange={recording.pausedByVisibilityChange}
                batteryLevel={recording.batteryLevel}
                actions={{
                  startRecording: recording.startRecording,
                  pauseRecording: recording.pauseRecording,
                  resumeRecording: recording.resumeRecording,
                  stopRecording: recording.stopRecording,
                  setSelectedMicrophone: recording.setSelectedMicrophone,
                }}
              />
              <AudioWaveform
                selectedMicrophone={recording.selectedMicrophone}
                recordingStatus={recording.uiStatus}
                isRecordingSupported={audioCapabilities.isRecordingSupported}
                recordDuration={recordDuration}
              />
            </>
          ) : (
            <AudioFileUpload
              onFileSelected={handleFileSelected}
              onFileClear={handleFileClear}
              isOnline={recording.isOnline}
              sessionId={sessionData?.id || ""}
              onFinishUpload={() => setNeedsAddress(true)}
            />
          )}
        </>
      )}

      {shouldShowPlayer && sessionData.id && (
        <Box className="border-t p-6">
          <SimpleAudioPlayer
            sessionId={sessionData.id}
            onLoadComplete={() => console.log("Audio loaded successfully")}
            shouldPollStatus={recordingStopped}
          />
        </Box>
      )}

      <LiveAssessmentModal
        isOpen={liveAssessmentOpen}
        onClose={() => setLiveAssessmentOpen(false)}
        onConfirm={handleLiveAssessmentConfirm}
        isOnline={recording.isOnline}
        isPaused={recording.uiStatus === "paused"}
      />

      <EndAssessmentModal
        isOpen={endAssessmentOpen}
        onClose={() => setEndAssessmentOpen(false)}
        onConfirm={handleEndAssessmentConfirm}
        isOnline={recording.isOnline}
        cannotConnectToServer={recording.cannotConnectToServer}
        isRecording={recording.uiStatus === "recording"}
        uploadDuration={
          statusData?.duration ? Math.floor(statusData.duration / 1000) : 0
        }
        recordDuration={Math.floor(recordDuration / 1000)}
        onPause={recording.pauseRecording}
      />

      <Dialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setPendingNavigation(null);
        }}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            m: 2,
            maxHeight: "calc(100% - 32px)",
          },
        }}
      >
        <DialogTitle id="confirm-dialog-title">Active Recording</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            You have an active recording. Are you sure you want to leave?
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            px: 3,
            pb: 2,
          }}
        >
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);
              setPendingNavigation(null);
            }}
            color="primary"
            fullWidth
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);

              // Pause the recording if it's currently recording
              if (recording.uiStatus === "recording") {
                recording.pauseRecording();
              }

              // Navigate based on pending navigation or default behavior
              if (pendingNavigation) {
                // Navigation triggered by safeNavigate (programmatic)
                router.push(pendingNavigation);
                setPendingNavigation(null);
              } else {
                // Navigation triggered by back button or other means
                if (clientRecord?.pseudonymized_client_id) {
                  router.push(
                    `/clients/intake/${clientRecord.pseudonymized_client_id}`,
                  );
                } else {
                  router.back();
                }
              }
            }}
            color="error"
            variant="contained"
            fullWidth
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dark overlay when wakelock is active to preserve battery */}
      {isWakeLockActive && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default RecordingInterface;
