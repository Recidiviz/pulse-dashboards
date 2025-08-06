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

import { Box, Paper, Typography } from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";

import EndAssessmentModal from "~@reentry/frontend/components/recording/modals/EndAssessmentModal";
import LiveAssessmentModal from "~@reentry/frontend/components/recording/modals/LiveAssessmentModal";
import { useAudioCapabilities } from "~@reentry/frontend/hooks/useAudioCapabilities";
import { useRecording } from "~@reentry/frontend/hooks/useRecording";
import type {
  ClientRecordResponse,
  RecordingSessionResponse,
} from "~@reentry/frontend/types/recording";

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
  const [recordingStopped, setRecordingStopped] = useState(false);
  const [liveAssessmentOpen, setLiveAssessmentOpen] = useState(false);
  const [endAssessmentOpen, setEndAssessmentOpen] = useState(false);
  const [modalConfirmAction, setModalConfirmAction] = useState<
    (() => void) | null
  >(null);

  const audioCapabilities = useAudioCapabilities();

  const handleRecordingStopped = () => {
    setRecordingStopped(true);
    onRecordingStopped?.();
  };

  const recording = useRecording({
    supportedFormat: audioCapabilities.supportedFormat,
    isRecordingSupported: audioCapabilities.isRecordingSupported,
    sessionId: sessionData?.id,
    sessionData,
    onRecordingStopped: handleRecordingStopped,
  });

  // Select first available microphone by default
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
    <div className="w-full">
      {shouldShowControls && (
        <RecordingControls
          recordingStatus={recording.uiStatus}
          selectedMicrophone={recording.selectedMicrophone}
          microphones={audioCapabilities.microphones}
          isRecordingSupported={audioCapabilities.isRecordingSupported}
          chunkCount={recording.chunkCount}
          openLiveAssessmentModal={openLiveAssessmentModal}
          setEndAssessmentOpen={setEndAssessmentOpen}
          actions={{
            startRecording: recording.startRecording,
            pauseRecording: recording.pauseRecording,
            resumeRecording: recording.resumeRecording,
            stopRecording: recording.stopRecording,
            setSelectedMicrophone: recording.setSelectedMicrophone,
          }}
        />
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
      />

      <EndAssessmentModal
        isOpen={endAssessmentOpen}
        onClose={() => setEndAssessmentOpen(false)}
        onConfirm={handleEndAssessmentConfirm}
      />
    </div>
  );
};

export default RecordingInterface;
