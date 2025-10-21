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
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useRef, useState } from "react";

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

import AudioWaveform from "./AudioWaveform";
import RecordingControls from "./RecordingControls";
import { SimpleAudioPlayer } from "./SimpleAudioPlayer";

interface RecordingInterfaceProps {
  clientRecord: ClientRecordResponse | null | undefined;
  sessionData: RecordingSessionResponse | null | undefined;
  onRecordingStopped?: () => void;
  setNeedsAddress: (needs: boolean) => void;
}

const RecordingInterface: React.FC<RecordingInterfaceProps> = ({
  clientRecord,
  sessionData,
  onRecordingStopped,
  setNeedsAddress,
}) => {
  const { statusData } = useRecordingSessionStatus(sessionData?.id || "", true);
  const [recordingStopped, setRecordingStopped] = useState(false);
  const [liveAssessmentOpen, setLiveAssessmentOpen] = useState(false);
  const [endAssessmentOpen, setEndAssessmentOpen] = useState(false);
  const [modalConfirmAction, setModalConfirmAction] = useState<
    (() => void) | null
  >(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

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
    clientPseudoId: clientRecord?.pseudonymized_client_id
  });

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

  return (
    <div className="w-full flex flex-col">
      {shouldShowControls && (
        <>
          <RecordingControls
            recordingStatus={recording.uiStatus}
            selectedMicrophone={recording.selectedMicrophone}
            microphones={audioCapabilities.microphones}
            isRecordingSupported={audioCapabilities.isRecordingSupported}
            chunkCount={recording.chunkCount}
            uploadDuration={
              statusData?.duration ? Math.floor(statusData.duration / 1000) : 0
            }
            recordDuration={Math.floor(recordDuration / 1000)}
            openLiveAssessmentModal={openLiveAssessmentModal}
            setEndAssessmentOpen={setEndAssessmentOpen}
            isOnline={recording.isOnline}
            cannotConnectToServer={recording.cannotConnectToServer}
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
        }}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Active Recording</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            You have an active recording. Are you sure you want to leave?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);
            }}
            color="primary"
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

              // Navigate based on client record availability
              if (clientRecord?.pseudonymized_client_id) {
                router.push(
                  `/clients/intake/${clientRecord.pseudonymized_client_id}`,
                );
              } else {
                router.back();
              }
            }}
            color="error"
            variant="contained"
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RecordingInterface;
