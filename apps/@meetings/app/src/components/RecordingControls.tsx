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

import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import PauseSvg from "../assets/icons/pause.svg";
import PlaySvg from "../assets/icons/play.svg";
import StopSvg from "../assets/icons/stop.svg";
import { RecordingStatus } from "../common/types";
import { RecordingIndicator } from "../shared/ui/RecordingIndicator";
import { Typography } from "../shared/ui/Typography";
import { formatDurationNumeric } from "../utils/format";

interface RecordingControlsProps {
  status: Exclude<RecordingStatus, "ending">;
  durationMs: number;
  onStart: () => void;
  onStop: () => void;
  onPauseResume: () => void;
}

const StartButton: React.FC<{ onPress: () => void; disabled: boolean }> = ({
  onPress,
  disabled,
}) => (
  <TouchableOpacity
    className="flex-row items-center justify-center rounded-full bg-[#006C67] py-5"
    onPress={onPress}
    disabled={disabled}
  >
    <PlaySvg className="size-4 text-[#C1E3D8]" />
    <Typography className="ml-2 font-semibold text-white">
      Start Recording
    </Typography>
  </TouchableOpacity>
);

const StopButton: React.FC<{ onPress: () => void; disabled: boolean }> = ({
  onPress,
  disabled,
}) => {
  const bgClass = disabled ? "bg-gray-300" : "bg-[#B42D2D]";
  const textClass = disabled ? "text-gray-700" : "text-white";

  return (
    <TouchableOpacity
      className={`w-[120px] flex-row items-center justify-center rounded-full px-8 py-3 ${bgClass}`}
      onPress={onPress}
      disabled={disabled}
    >
      <StopSvg className="size-4 text-[#FFEAE5]" />
      <Typography className={`ml-2 font-semibold ${textClass}`}>
        Stop
      </Typography>
    </TouchableOpacity>
  );
};

const PauseResumeButton: React.FC<{
  status: Extract<RecordingStatus, "paused" | "recording" | "uploading">;
  onPress: () => void;
  disabled: boolean;
}> = ({ status, onPress, disabled }) => {
  const isUploading = status === "uploading";

  let bgColor = "#4D5255";
  if (isUploading) bgColor = "#D1D5DB";
  if (status === "paused") bgColor = "#006C67";

  const textClass = isUploading ? "text-gray-700" : "text-white";

  return (
    <TouchableOpacity
      className="ml-3 w-[120px] flex-row items-center justify-center rounded-full px-8 py-3"
      onPress={onPress}
      disabled={disabled}
      style={{ backgroundColor: bgColor }}
    >
      {isUploading ? (
        <ActivityIndicator size="small" color="white" className="mr-2" />
      ) : (
        <View className="mr-2">
          {status === "paused" ? (
            <PlaySvg className="size-4 text-[#C1E3D8]" />
          ) : (
            <PauseSvg className="size-4 text-[#EDF1F1]" />
          )}
        </View>
      )}
      <Typography className={`font-semibold ${textClass}`}>
        {status === "paused" ? "Resume" : "Pause"}
      </Typography>
    </TouchableOpacity>
  );
};

const RecordingControls: React.FC<RecordingControlsProps> = ({
  status,
  durationMs,
  onStart,
  onStop,
  onPauseResume,
}) => {
  const isUploading = status === "uploading";

  if (status === "idle") {
    return <StartButton onPress={onStart} disabled={isUploading} />;
  }

  return (
    <>
      <View className="flex-row items-center justify-center pb-2">
        {status === "recording" && <RecordingIndicator />}
        <Typography className="px-2 text-black">
          {status === "recording"
            ? "Recording in progress"
            : "Recording is paused"}{" "}
          {formatDurationNumeric(durationMs)}
        </Typography>
      </View>
      <View className="flex-row items-center justify-center">
        <StopButton onPress={onStop} disabled={isUploading} />
        <PauseResumeButton
          status={
            status as Extract<
              RecordingStatus,
              "paused" | "recording" | "uploading"
            >
          }
          onPress={onPauseResume}
          disabled={isUploading}
        />
      </View>
    </>
  );
};

export default RecordingControls;
