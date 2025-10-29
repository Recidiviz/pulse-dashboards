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
import BatteryLevel from "~@reentry/frontend/components/recording/BatteryLevel";
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
  pausedByVisibilityChange: boolean;
  batteryLevel: number | null;
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
  pausedByVisibilityChange: boolean;
  batteryLevel: number | null;
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
          <div
            className={
              "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto"
            }
          >
            <div className="w-full sm:w-auto">
              <FormControl
                fullWidth
                variant="outlined"
                size="small"
                className="sm:!w-64"
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
              className="h-10 sm:h-8 px-4 py-2 bg-[#006c67] rounded-[32px] text-white text-xs sm:text-[13px] font-medium font-['Public_Sans'] whitespace-nowrap"
              onClick={() => {
                openLiveAssessmentModal(actions.startRecording);
              }}
              disabled={!selectedMicrophone}
            />
          </div>
        );

      case "recording":
        return (
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
            <PrimaryButton
              buttonText="Pause Recording"
              onClick={actions.pauseRecording}
              className="h-10 sm:h-8 whitespace-nowrap text-xs sm:text-[13px]"
            />
            <PrimaryButton
              buttonText="End assessment"
              className="h-10 sm:h-8 px-3 sm:px-4 py-2 bg-red-600 rounded-[32px] text-white text-xs sm:text-[13px] font-medium font-['Public_Sans'] whitespace-nowrap"
              onClick={() => {
                setEndAssessmentOpen(true);
              }}
            />
          </div>
        );

      case "paused":
        return (
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
            <PrimaryButton
              buttonText="Resume Recording"
              onClick={() => {
                openLiveAssessmentModal(actions.resumeRecording);
              }}
              className="h-10 sm:h-8 whitespace-nowrap text-xs sm:text-[13px]"
            />
            <PrimaryButton
              buttonText="End Assessment"
              className="h-10 sm:h-8 px-3 sm:px-4 py-2 bg-red-600 rounded-[32px] text-white text-xs sm:text-[13px] font-medium font-['Public_Sans'] whitespace-nowrap"
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

  return <div className="flex items-center gap-3 ">{renderButtons()}</div>;
};

const RecordingStatusText: React.FC<RecordingStatusTextProps> = ({
  recordingStatus,
  isRecordingSupported,
  chunkCount,
  uploadDuration,
  recordDuration,
  isOnline,
  cannotConnectToServer,
  pausedByVisibilityChange,
  batteryLevel,
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
                <Typography className="text-[10px] sm:text-xs text-gray-500">
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
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex flex-col items-center justify-center">
                  <Typography className="text-xs sm:text-sm">
                    Recording in progress...
                  </Typography>
                  <BatteryLevel batteryLevel={batteryLevel} />
                </div>
              </div>
              {recordDuration > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <Typography className="text-[10px] sm:text-xs text-gray-500">
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
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <div className="w-3 h-3 bg-gray-600 rounded-full flex-shrink-0" />
                <div className="flex flex-col items-center justify-center">
                  <Typography className="text-xs sm:text-sm">
                    {pausedByVisibilityChange
                      ? "Recording paused due to tab switch - click Resume to continue"
                      : "Recording paused - click Resume to continue"}
                  </Typography>
                  <BatteryLevel batteryLevel={batteryLevel} />
                </div>
              </div>
              {recordDuration > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <Typography className="text-[10px] sm:text-xs text-gray-500">
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
          <div className="space-y-2 sm:space-y-3">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse flex-shrink-0" />
                <Typography className="text-xs sm:text-sm">
                  Processing recording...
                </Typography>
              </div>
              {uploadDuration > 0 && (
                <div className="flex items-center justify-center">
                  <Typography className="text-[10px] sm:text-xs text-gray-500">
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
          <div className="space-y-2 sm:space-y-3">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <div className="w-3 h-3 bg-green-600 rounded-full flex-shrink-0" />
                <Typography className="text-xs sm:text-sm">
                  Recording complete
                </Typography>
              </div>
              {uploadDuration > 0 && (
                <div className="flex items-center justify-center">
                  <Typography className="text-[10px] sm:text-xs text-gray-500">
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
  pausedByVisibilityChange,
  batteryLevel,
}) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-3 bg-white rounded-[32px] sm:rounded-[99px] outline outline-1 outline-offset-[-1px] outline-[#2b5469]/10 flex flex-col sm:flex-row items-center justify-center lg:justify-between gap-3 sm:gap-4 lg:gap-0">
      <div className="hidden lg:block flex-shrink-0"></div>
      <div className="flex items-center justify-center gap-4 order-1 sm:order-none">
        <RecordingStatusText
          recordingStatus={recordingStatus}
          isRecordingSupported={isRecordingSupported}
          chunkCount={chunkCount}
          uploadDuration={uploadDuration}
          recordDuration={recordDuration}
          isOnline={isOnline}
          cannotConnectToServer={cannotConnectToServer}
          pausedByVisibilityChange={pausedByVisibilityChange}
          batteryLevel={batteryLevel}
          formatDuration={formatDuration}
        />
      </div>
      <div className="flex items-center justify-center gap-3 order-2 sm:order-none w-full sm:w-auto">
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
