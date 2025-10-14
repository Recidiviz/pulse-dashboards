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

import { CloudOff } from "@mui/icons-material";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";

import PrimaryButton from "~@reentry/frontend/components/buttons/PrimaryButton";
import StatusIndicators from "~@reentry/frontend/components/recording/StatusIndicators";
import type {
  MediaDevice,
  RecordingActions,
  UIRecordingStatus,
} from "~@reentry/frontend/types/recording";

interface RecordingControlsProps {
  recordingStatus: UIRecordingStatus;
  selectedMicrophone: string;
  microphones: MediaDevice[];
  isRecordingSupported: boolean;
  chunkCount?: number;
  uploadDuration?: number;
  recordDuration?: number;
  actions: RecordingActions;
  openLiveAssessmentModal: (action: () => void) => void;
  setEndAssessmentOpen: (open: boolean) => void;
  isOnline: boolean;
  cannotConnectToServer: boolean;
}

interface RecordingControlsButtonsProps {
  recordingStatus: UIRecordingStatus;
  selectedMicrophone: string;
  microphones: MediaDevice[];
  isRecordingSupported: boolean;
  actions: RecordingActions;
  openLiveAssessmentModal: (action: () => void) => void;
  setEndAssessmentOpen: (open: boolean) => void;
  isOnline: boolean;
  uploadDuration?: number;
}

interface RecordingStatusTextProps {
  recordingStatus: UIRecordingStatus;
  isRecordingSupported: boolean;
  chunkCount: number;
  uploadDuration: number;
  recordDuration: number;
  isOnline: boolean;
  cannotConnectToServer: boolean;
  formatDuration: (seconds: number) => string;
}

const RecordingControlsButtons: React.FC<RecordingControlsButtonsProps> = ({
  recordingStatus,
  selectedMicrophone,
  microphones,
  isRecordingSupported,
  actions,
  openLiveAssessmentModal,
  setEndAssessmentOpen,
  uploadDuration = 0,
}) => {
  if (!isRecordingSupported) {
    return (
      <div className="text-red-600 text-sm font-medium">
        Recording not supported on this device.
      </div>
    );
  }

  const renderButtons = () => {
    switch (recordingStatus) {
      case "created":
        return (
          <div className={"flex items-center gap-3"}>
            <div className="">
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                className="!w-64"
              >
                <InputLabel>Select Microphone</InputLabel>
                <Select
                  value={selectedMicrophone}
                  onChange={(e) =>
                    actions.setSelectedMicrophone(e.target.value)
                  }
                  label="Select Microphone"
                >
                  {microphones.map((mic) => (
                    <MenuItem key={mic.deviceId} value={mic.deviceId}>
                      {mic.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <PrimaryButton
              buttonText={
                uploadDuration > 0 ? "Resume Recording" : "Start Recording"
              }
              className="h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
              onClick={() => {
                openLiveAssessmentModal(actions.startRecording);
              }}
              disabled={!selectedMicrophone}
            />
          </div>
        );

      case "recording":
        return (
          <div className="flex items-center gap-3">
            <PrimaryButton
              buttonText="Pause Recording"
              onClick={actions.pauseRecording}
            />
            <PrimaryButton
              buttonText="End assessment"
              className="h-8 px-4 py-2 bg-red-600 rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
              onClick={() => {
                setEndAssessmentOpen(true);
              }}
            />
          </div>
        );

      case "paused":
        return (
          <div className="flex items-center gap-3">
            <PrimaryButton
              buttonText="Resume Recording"
              onClick={() => {
                openLiveAssessmentModal(actions.resumeRecording);
              }}
            />
            <PrimaryButton
              buttonText="End Assessment"
              className="h-8 px-4 py-2 bg-red-600 rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
              onClick={() => {
                setEndAssessmentOpen(true);
              }}
            />
          </div>
        );

      case "processing":
        return (
          <PrimaryButton
            buttonText="Processing"
            className="h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
            onClick={actions.startRecording}
            disabled={true}
          />
        );
      case "completed":
        return (
          <PrimaryButton
            buttonText="Recording completed"
            className="h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-[13px] font-medium font-['Public_Sans']"
            onClick={actions.startRecording}
            disabled={true}
          />
        );
      default:
        return null;
    }
  };

  return <div className="flex items-center gap-3">{renderButtons()}</div>;
};

const RecordingStatusText: React.FC<RecordingStatusTextProps> = ({
  recordingStatus,
  isRecordingSupported,
  chunkCount,
  uploadDuration,
  recordDuration,
  isOnline,
  cannotConnectToServer,
  formatDuration,
}) => {
  if (!isRecordingSupported) {
    return (
      <div className="text-red-600 text-sm font-medium">
        Recording not supported on this device.
      </div>
    );
  }

  const renderStatus = () => {
    switch (recordingStatus) {
      case "created":
        return (
          <div className={"flex gap-4"}>
            {uploadDuration > 0 && (
              <div className="flex items-center justify-center space-x-2">
                <Typography className="text-xs text-gray-500">
                  Duration: {formatDuration(uploadDuration)} ({chunkCount}{" "}
                  chunks)
                </Typography>
                <StatusIndicators
                  isOnline={isOnline}
                  cannotConnectToServer={cannotConnectToServer}
                  uploadDuration={uploadDuration}
                  recordDuration={recordDuration}
                />
              </div>
            )}
          </div>
        );
      case "recording":
        return (
          <div className="flex items-center gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <Typography className="text-sm">
                  Recording in progress...
                </Typography>
              </div>
              {recordDuration > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <Typography className="text-xs text-gray-500">
                    Duration: {formatDuration(recordDuration)} ({chunkCount}{" "}
                    chunks)
                  </Typography>
                  <StatusIndicators
                    isOnline={isOnline}
                    cannotConnectToServer={cannotConnectToServer}
                    uploadDuration={uploadDuration}
                    recordDuration={recordDuration}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case "paused":
        return (
          <div className="flex items-center gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <div className="w-3 h-3 bg-gray-600 rounded-full" />
                <Typography className="text-sm">
                  Recording paused - click Resume to continue
                </Typography>
              </div>
              {recordDuration > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <Typography className="text-xs text-gray-500">
                    Duration: {formatDuration(recordDuration)} ({chunkCount}{" "}
                    chunks)
                  </Typography>
                  <StatusIndicators
                    isOnline={isOnline}
                    cannotConnectToServer={cannotConnectToServer}
                    uploadDuration={uploadDuration}
                    recordDuration={recordDuration}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case "processing":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                <Typography className="text-sm">
                  Processing recording...
                </Typography>
              </div>
              {uploadDuration > 0 && (
                <div className="flex items-center justify-center">
                  <Typography className="text-xs text-gray-500">
                    Finalizing {formatDuration(uploadDuration)} of audio (
                    {chunkCount} chunks)
                  </Typography>
                </div>
              )}
            </div>
          </div>
        );
      case "completed":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
                <Typography className="text-sm">Recording complete</Typography>
              </div>
              {uploadDuration > 0 && (
                <div className="flex items-center justify-center">
                  <Typography className="text-xs text-gray-500">
                    Total duration: {formatDuration(uploadDuration)} (
                    {chunkCount} chunks)
                  </Typography>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {!isOnline && (
        <Tooltip title="You are offline">
          <div className="flex items-center gap-2 text-red-600">
            <CloudOff fontSize="small" />
            <span className="text-sm font-medium">Offline</span>
          </div>
        </Tooltip>
      )}
      {renderStatus()}
    </div>
  );
};

const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingStatus,
  selectedMicrophone,
  microphones,
  isRecordingSupported,
  chunkCount = 0,
  uploadDuration = 0,
  recordDuration = 0,
  actions,
  openLiveAssessmentModal,
  setEndAssessmentOpen,
  isOnline,
  cannotConnectToServer,
}) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full px-6 py-3 bg-white rounded-[99px] outline outline-1 outline-offset-[-1px] outline-[#2b5469]/10 flex items-center justify-between">
      <div className="opacity-0">
        <div className="h-8 px-4 py-2 bg-[#006c67] rounded-[32px] flex items-center justify-center text-white text-[13px] font-medium">
          {uploadDuration ? "Start Recording" : "Resume Recording"}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <RecordingStatusText
          recordingStatus={recordingStatus}
          isRecordingSupported={isRecordingSupported}
          chunkCount={chunkCount}
          uploadDuration={uploadDuration}
          recordDuration={recordDuration}
          isOnline={isOnline}
          cannotConnectToServer={cannotConnectToServer}
          formatDuration={formatDuration}
        />
      </div>
      <div className="flex items-center gap-3">
        <RecordingControlsButtons
          recordingStatus={recordingStatus}
          selectedMicrophone={selectedMicrophone}
          microphones={microphones}
          isRecordingSupported={isRecordingSupported}
          actions={actions}
          openLiveAssessmentModal={openLiveAssessmentModal}
          setEndAssessmentOpen={setEndAssessmentOpen}
          isOnline={isOnline}
          uploadDuration={uploadDuration}
        />
      </div>
    </div>
  );
};

export default RecordingControls;
